"""
Stripe Payment Routes

API endpoints for:
- POST /api/checkout: Create checkout session (authenticated)
- POST /api/billing-portal: Create billing portal session (authenticated)
- POST /api/subscription: Get subscription status (authenticated)
- POST /webhook/stripe: Handle Stripe webhooks (unauthenticated, signature verified)
"""
from typing import Optional

from fastapi import APIRouter, Request, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

import structlog

from services.payment_service import (
    create_checkout_session,
    handle_webhook,
    get_subscription_info,
    create_billing_portal_session,
    PaymentServiceError,
    StripeNotConfiguredError,
    WebhookVerificationError,
    CustomerNotFoundError,
)
from middleware.clerk_auth import require_auth

logger = structlog.get_logger(__name__)

# =============================================================================
# ROUTERS
# =============================================================================

# Authenticated API routes
router = APIRouter(prefix="/api", tags=["Payments"])

# Unauthenticated webhook route (signature verified internally)
webhook_router = APIRouter(tags=["Webhooks"])


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class CheckoutRequest(BaseModel):
    """Request to create a checkout session."""
    user_id: str = Field(min_length=1, max_length=64)
    price_id: str = Field(min_length=1, max_length=128, description="Stripe Price ID (price_xxxxx)")
    email: Optional[str] = Field(default=None, max_length=254)
    success_url: Optional[str] = Field(default=None, max_length=500)
    cancel_url: Optional[str] = Field(default=None, max_length=500)


class CheckoutResponse(BaseModel):
    """Response with checkout session details."""
    session_id: str
    checkout_url: str


class BillingPortalRequest(BaseModel):
    """Request to create a billing portal session."""
    user_id: str = Field(min_length=1, max_length=64)
    return_url: str = Field(max_length=500, default="http://localhost:3000/settings")


class BillingPortalResponse(BaseModel):
    """Response with billing portal URL."""
    portal_url: str


class SubscriptionStatusRequest(BaseModel):
    """Request to get subscription status."""
    user_id: str = Field(min_length=1, max_length=64)


class SubscriptionStatusResponse(BaseModel):
    """Response with subscription details."""
    has_subscription: bool
    status: Optional[str] = None
    plan_id: Optional[str] = None
    current_period_end: Optional[int] = None
    cancel_at_period_end: bool = False


# =============================================================================
# CHECKOUT ENDPOINT
# =============================================================================

@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: Request,
    body: CheckoutRequest,
    current_user: dict = Depends(require_auth),
):
    """
    Create a Stripe Checkout session to start a subscription.
    
    The user will be redirected to Stripe's hosted checkout page.
    After payment, they'll be redirected to success_url or cancel_url.
    
    **Authentication Required**: Yes (Clerk JWT)
    
    **Request Body**:
    - `user_id`: Clerk user ID
    - `price_id`: Stripe Price ID (from your Stripe Dashboard)
    - `email`: Optional customer email
    - `success_url`: Where to redirect after successful payment
    - `cancel_url`: Where to redirect if user cancels
    
    **Response**:
    - `session_id`: Stripe session ID (for client-side redirect)
    - `checkout_url`: Direct URL to the checkout page
    """
    log = logger.bind(user_id=body.user_id, price_id=body.price_id)
    log.info("checkout_request_received")
    
    # Verify user_id matches authenticated user
    auth_user_id = current_user.get("user_id")
    if auth_user_id and auth_user_id != body.user_id:
        log.warning("checkout_user_mismatch", auth_user_id=auth_user_id)
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    try:
        result = await create_checkout_session(
            user_id=body.user_id,
            price_id=body.price_id,
            email=body.email,
            success_url=body.success_url,
            cancel_url=body.cancel_url,
        )
        
        return CheckoutResponse(
            session_id=result.session_id,
            checkout_url=result.checkout_url,
        )
        
    except StripeNotConfiguredError as e:
        log.error("stripe_not_configured", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured. Please contact support."
        )
    except PaymentServiceError as e:
        log.error("checkout_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# BILLING PORTAL ENDPOINT
# =============================================================================

@router.post("/billing-portal", response_model=BillingPortalResponse)
async def create_portal(
    request: Request,
    body: BillingPortalRequest,
    current_user: dict = Depends(require_auth),
):
    """
    Create a Stripe Billing Portal session for subscription self-service.
    
    Users can manage their subscription:
    - Update payment method
    - View invoices
    - Cancel subscription
    
    **Authentication Required**: Yes (Clerk JWT)
    
    **Request Body**:
    - `user_id`: Clerk user ID
    - `return_url`: Where to redirect after portal session
    
    **Response**:
    - `portal_url`: URL to redirect user to
    """
    log = logger.bind(user_id=body.user_id)
    log.info("billing_portal_request_received")
    
    # Verify user_id matches authenticated user
    auth_user_id = current_user.get("user_id")
    if auth_user_id and auth_user_id != body.user_id:
        log.warning("portal_user_mismatch", auth_user_id=auth_user_id)
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    try:
        portal_url = await create_billing_portal_session(
            user_id=body.user_id,
            return_url=body.return_url,
        )
        
        return BillingPortalResponse(portal_url=portal_url)
        
    except CustomerNotFoundError:
        log.warning("no_customer_for_portal")
        raise HTTPException(
            status_code=404,
            detail="No subscription found. Please subscribe first."
        )
    except StripeNotConfiguredError as e:
        log.error("stripe_not_configured", error=str(e))
        raise HTTPException(
            status_code=503,
            detail="Payment service is not configured. Please contact support."
        )
    except PaymentServiceError as e:
        log.error("portal_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# SUBSCRIPTION STATUS ENDPOINT
# =============================================================================

@router.post("/subscription", response_model=SubscriptionStatusResponse)
async def get_subscription(
    request: Request,
    body: SubscriptionStatusRequest,
    current_user: dict = Depends(require_auth),
):
    """
    Get current subscription status for a user.
    
    **Authentication Required**: Yes (Clerk JWT)
    
    **Request Body**:
    - `user_id`: Clerk user ID
    
    **Response**:
    - `has_subscription`: Whether user has any subscription record
    - `status`: Subscription status (active, past_due, canceled, etc.)
    - `plan_id`: Stripe Price ID
    - `current_period_end`: Unix timestamp of current billing period end
    - `cancel_at_period_end`: Whether subscription is scheduled to cancel
    """
    log = logger.bind(user_id=body.user_id)
    
    # Verify user_id matches authenticated user
    auth_user_id = current_user.get("user_id")
    if auth_user_id and auth_user_id != body.user_id:
        log.warning("subscription_user_mismatch", auth_user_id=auth_user_id)
        raise HTTPException(status_code=403, detail="User ID mismatch")
    
    try:
        info = await get_subscription_info(body.user_id)
        
        if not info:
            return SubscriptionStatusResponse(has_subscription=False)
        
        return SubscriptionStatusResponse(
            has_subscription=True,
            status=info.status.value,
            plan_id=info.plan_id,
            current_period_end=info.current_period_end,
            cancel_at_period_end=info.cancel_at_period_end,
        )
        
    except Exception as e:
        log.error("subscription_status_failed", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch subscription status")


# =============================================================================
# STRIPE WEBHOOK ENDPOINT
# =============================================================================

@webhook_router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
):
    """
    Handle Stripe webhook events.
    
    **Authentication**: None (signature verified internally)
    
    This endpoint receives events from Stripe:
    - `checkout.session.completed`: User completed checkout
    - `invoice.payment_succeeded`: Recurring payment successful
    - `invoice.payment_failed`: Payment failed
    - `customer.subscription.updated`: Subscription changed
    - `customer.subscription.deleted`: Subscription canceled
    
    **SECURITY**: Webhook signature is verified using STRIPE_WEBHOOK_SECRET.
    Never process events without verification.
    """
    log = logger.bind(endpoint="stripe_webhook")
    
    # Validate signature header exists
    if not stripe_signature:
        log.warning("webhook_missing_signature")
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")
    
    # Get raw body for signature verification
    try:
        payload = await request.body()
    except Exception as e:
        log.error("webhook_body_read_failed", error=str(e))
        raise HTTPException(status_code=400, detail="Failed to read request body")
    
    try:
        success, message = await handle_webhook(payload, stripe_signature)
        
        if success:
            log.info("webhook_processed", message=message)
            return JSONResponse(
                status_code=200,
                content={"received": True, "message": message}
            )
        else:
            log.warning("webhook_processing_issue", message=message)
            return JSONResponse(
                status_code=200,  # Return 200 to prevent Stripe retries
                content={"received": True, "message": message}
            )
            
    except WebhookVerificationError as e:
        log.error("webhook_verification_failed", error=str(e))
        raise HTTPException(status_code=400, detail="Webhook signature verification failed")
    
    except PaymentServiceError as e:
        log.error("webhook_processing_failed", error=str(e))
        # Return 500 so Stripe will retry the webhook
        raise HTTPException(status_code=500, detail="Webhook processing failed")
