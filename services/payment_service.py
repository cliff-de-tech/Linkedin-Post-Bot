"""
Stripe Payment Service

Handles all Stripe-related operations:
- Creating checkout sessions for subscriptions
- Processing webhooks for payment events
- Managing subscription lifecycle

SECURITY CRITICAL:
- Webhook signature verification prevents spoofed events
- All Stripe API calls use server-side secret key
- Customer IDs are never exposed to frontend
"""
import os
import time
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

import stripe
import structlog

from services.db import get_database

logger = structlog.get_logger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_SUCCESS_URL = os.getenv("STRIPE_SUCCESS_URL", "http://localhost:3000/dashboard?payment=success")
STRIPE_CANCEL_URL = os.getenv("STRIPE_CANCEL_URL", "http://localhost:3000/pricing")

# Initialize Stripe client
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
else:
    logger.warning("STRIPE_SECRET_KEY not set - payment features disabled")


# =============================================================================
# CUSTOM EXCEPTIONS
# =============================================================================

class PaymentServiceError(Exception):
    """Base exception for payment service errors."""
    pass


class StripeNotConfiguredError(PaymentServiceError):
    """Raised when Stripe keys are not configured."""
    pass


class WebhookVerificationError(PaymentServiceError):
    """Raised when webhook signature verification fails."""
    pass


class CustomerNotFoundError(PaymentServiceError):
    """Raised when a Stripe customer is not found."""
    pass


class SubscriptionError(PaymentServiceError):
    """Raised when subscription operations fail."""
    pass


# =============================================================================
# DATA CLASSES
# =============================================================================

class SubscriptionStatus(str, Enum):
    """Stripe subscription statuses we handle."""
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"
    INACTIVE = "inactive"


@dataclass
class CheckoutSessionResult:
    """Result of creating a checkout session."""
    session_id: str
    checkout_url: str


@dataclass
class SubscriptionInfo:
    """Subscription information for a user."""
    user_id: str
    stripe_customer_id: Optional[str]
    stripe_subscription_id: Optional[str]
    plan_id: Optional[str]
    status: SubscriptionStatus
    current_period_end: Optional[int]
    cancel_at_period_end: bool


# =============================================================================
# STRIPE HELPER FUNCTIONS
# =============================================================================

def _ensure_stripe_configured() -> None:
    """Ensure Stripe is properly configured."""
    if not STRIPE_SECRET_KEY:
        raise StripeNotConfiguredError(
            "STRIPE_SECRET_KEY environment variable is not set. "
            "Payment features are disabled."
        )


async def _get_or_create_stripe_customer(user_id: str, email: Optional[str] = None) -> str:
    """
    Get existing Stripe customer ID or create a new one.
    
    Args:
        user_id: Clerk user ID
        email: Optional email for the customer
        
    Returns:
        Stripe customer ID (cus_xxxxx)
    """
    _ensure_stripe_configured()
    
    db = get_database()
    
    # Check if user already has a Stripe customer ID
    query = """
        SELECT stripe_customer_id FROM subscriptions WHERE user_id = :user_id
    """
    result = await db.fetch_one(query=query, values={"user_id": user_id})
    
    if result and result["stripe_customer_id"]:
        logger.debug("found_existing_customer", user_id=user_id, customer_id=result["stripe_customer_id"])
        return result["stripe_customer_id"]
    
    # Create new Stripe customer
    try:
        customer = stripe.Customer.create(
            metadata={"user_id": user_id},
            email=email,
        )
        logger.info("created_stripe_customer", user_id=user_id, customer_id=customer.id)
        
        # Store the customer ID
        now = int(time.time())
        upsert_query = """
            INSERT INTO subscriptions (user_id, stripe_customer_id, status, created_at, updated_at)
            VALUES (:user_id, :stripe_customer_id, :status, :created_at, :updated_at)
            ON CONFLICT (user_id) DO UPDATE SET
                stripe_customer_id = :stripe_customer_id,
                updated_at = :updated_at
        """
        await db.execute(
            query=upsert_query,
            values={
                "user_id": user_id,
                "stripe_customer_id": customer.id,
                "status": SubscriptionStatus.INACTIVE.value,
                "created_at": now,
                "updated_at": now,
            }
        )
        
        return customer.id
        
    except stripe.StripeError as e:
        logger.error("stripe_customer_creation_failed", user_id=user_id, error=str(e))
        raise PaymentServiceError(f"Failed to create Stripe customer: {e}")


# =============================================================================
# CHECKOUT SESSION
# =============================================================================

async def create_checkout_session(
    user_id: str,
    price_id: str,
    email: Optional[str] = None,
    success_url: Optional[str] = None,
    cancel_url: Optional[str] = None,
) -> CheckoutSessionResult:
    """
    Create a Stripe Checkout Session for subscription.
    
    Args:
        user_id: Clerk user ID
        price_id: Stripe Price ID (price_xxxxx)
        email: Optional customer email
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect if user cancels
        
    Returns:
        CheckoutSessionResult with session ID and URL
    """
    _ensure_stripe_configured()
    
    log = logger.bind(user_id=user_id, price_id=price_id)
    log.info("creating_checkout_session")
    
    try:
        # Get or create Stripe customer
        customer_id = await _get_or_create_stripe_customer(user_id, email)
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            success_url=success_url or STRIPE_SUCCESS_URL,
            cancel_url=cancel_url or STRIPE_CANCEL_URL,
            metadata={
                "user_id": user_id,
            },
            subscription_data={
                "metadata": {
                    "user_id": user_id,
                },
            },
            # Allow promotion codes
            allow_promotion_codes=True,
            # Collect billing address for invoices
            billing_address_collection="auto",
        )
        
        log.info("checkout_session_created", session_id=session.id)
        
        return CheckoutSessionResult(
            session_id=session.id,
            checkout_url=session.url,
        )
        
    except stripe.StripeError as e:
        log.error("checkout_session_failed", error=str(e))
        raise PaymentServiceError(f"Failed to create checkout session: {e}")


# =============================================================================
# WEBHOOK HANDLING
# =============================================================================

def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """
    Verify Stripe webhook signature and construct event.
    
    SECURITY CRITICAL: This prevents spoofed webhook events.
    
    Args:
        payload: Raw request body bytes
        sig_header: Stripe-Signature header value
        
    Returns:
        Verified Stripe Event object
        
    Raises:
        WebhookVerificationError: If signature is invalid
    """
    if not STRIPE_WEBHOOK_SECRET:
        raise WebhookVerificationError(
            "STRIPE_WEBHOOK_SECRET not configured. Cannot verify webhook."
        )
    
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=STRIPE_WEBHOOK_SECRET,
        )
        logger.debug("webhook_signature_verified", event_type=event.type)
        return event
        
    except stripe.SignatureVerificationError as e:
        logger.error("webhook_signature_invalid", error=str(e))
        raise WebhookVerificationError(f"Invalid webhook signature: {e}")
    except ValueError as e:
        logger.error("webhook_payload_invalid", error=str(e))
        raise WebhookVerificationError(f"Invalid webhook payload: {e}")


async def handle_webhook(payload: bytes, sig_header: str) -> Tuple[bool, str]:
    """
    Process Stripe webhook event.
    
    Args:
        payload: Raw request body bytes
        sig_header: Stripe-Signature header value
        
    Returns:
        Tuple of (success: bool, message: str)
    """
    # Verify signature first (SECURITY CRITICAL)
    event = verify_webhook_signature(payload, sig_header)
    
    event_type = event.type
    event_data = event.data.object
    
    log = logger.bind(event_type=event_type, event_id=event.id)
    log.info("processing_webhook")
    
    try:
        # Route to appropriate handler
        if event_type == "checkout.session.completed":
            await _handle_checkout_completed(event_data)
            return True, "Checkout session completed"
            
        elif event_type == "invoice.payment_succeeded":
            await _handle_invoice_paid(event_data)
            return True, "Invoice payment succeeded"
            
        elif event_type == "invoice.payment_failed":
            await _handle_invoice_failed(event_data)
            return True, "Invoice payment failed - subscription updated"
            
        elif event_type == "customer.subscription.updated":
            await _handle_subscription_updated(event_data)
            return True, "Subscription updated"
            
        elif event_type == "customer.subscription.deleted":
            await _handle_subscription_deleted(event_data)
            return True, "Subscription canceled"
            
        else:
            log.debug("webhook_event_ignored", reason="unhandled_event_type")
            return True, f"Event type {event_type} ignored"
            
    except Exception as e:
        log.error("webhook_processing_failed", error=str(e), exc_info=True)
        raise PaymentServiceError(f"Webhook processing failed: {e}")


async def _handle_checkout_completed(session: Dict[str, Any]) -> None:
    """
    Handle checkout.session.completed event.
    
    This fires when user completes the Stripe Checkout flow.
    We update the subscription record and user tier.
    """
    user_id = session.get("metadata", {}).get("user_id")
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    
    log = logger.bind(user_id=user_id, subscription_id=subscription_id)
    
    if not user_id:
        log.warning("checkout_completed_missing_user_id")
        return
    
    if not subscription_id:
        log.debug("checkout_completed_no_subscription", mode=session.get("mode"))
        return
    
    # Fetch full subscription details from Stripe
    subscription = stripe.Subscription.retrieve(subscription_id)
    
    await _update_subscription_record(
        user_id=user_id,
        customer_id=customer_id,
        subscription_id=subscription_id,
        subscription=subscription,
    )
    
    log.info("checkout_completed_processed")


async def _handle_invoice_paid(invoice: Dict[str, Any]) -> None:
    """
    Handle invoice.payment_succeeded event.
    
    This fires on successful recurring payments.
    We update the subscription period dates.
    """
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")
    
    if not subscription_id:
        return
    
    log = logger.bind(subscription_id=subscription_id)
    
    # Fetch subscription to get updated period dates
    subscription = stripe.Subscription.retrieve(subscription_id)
    
    # Find user by customer ID
    db = get_database()
    query = "SELECT user_id FROM subscriptions WHERE stripe_customer_id = :customer_id"
    result = await db.fetch_one(query=query, values={"customer_id": customer_id})
    
    if not result:
        log.warning("invoice_paid_unknown_customer", customer_id=customer_id)
        return
    
    user_id = result["user_id"]
    
    await _update_subscription_record(
        user_id=user_id,
        customer_id=customer_id,
        subscription_id=subscription_id,
        subscription=subscription,
    )
    
    log.info("invoice_paid_processed", user_id=user_id)


async def _handle_invoice_failed(invoice: Dict[str, Any]) -> None:
    """
    Handle invoice.payment_failed event.
    
    This fires when a payment fails (e.g., card declined).
    We update the subscription status to past_due.
    """
    subscription_id = invoice.get("subscription")
    customer_id = invoice.get("customer")
    
    if not subscription_id:
        return
    
    log = logger.bind(subscription_id=subscription_id)
    
    db = get_database()
    now = int(time.time())
    
    # Update subscription status
    query = """
        UPDATE subscriptions 
        SET status = :status, updated_at = :updated_at
        WHERE stripe_subscription_id = :subscription_id
    """
    await db.execute(
        query=query,
        values={
            "status": SubscriptionStatus.PAST_DUE.value,
            "subscription_id": subscription_id,
            "updated_at": now,
        }
    )
    
    # Also update user_settings tier if needed
    query = """
        UPDATE user_settings 
        SET subscription_status = :status, updated_at = :updated_at
        WHERE user_id = (
            SELECT user_id FROM subscriptions WHERE stripe_subscription_id = :subscription_id
        )
    """
    await db.execute(
        query=query,
        values={
            "status": "past_due",
            "subscription_id": subscription_id,
            "updated_at": now,
        }
    )
    
    log.info("invoice_failed_processed")


async def _handle_subscription_updated(subscription: Dict[str, Any]) -> None:
    """
    Handle customer.subscription.updated event.
    
    This fires on any subscription change (plan upgrade, cancel scheduled, etc).
    """
    subscription_id = subscription.get("id")
    customer_id = subscription.get("customer")
    
    log = logger.bind(subscription_id=subscription_id)
    
    # Find user by customer ID
    db = get_database()
    query = "SELECT user_id FROM subscriptions WHERE stripe_customer_id = :customer_id"
    result = await db.fetch_one(query=query, values={"customer_id": customer_id})
    
    if not result:
        log.warning("subscription_updated_unknown_customer", customer_id=customer_id)
        return
    
    user_id = result["user_id"]
    
    await _update_subscription_record(
        user_id=user_id,
        customer_id=customer_id,
        subscription_id=subscription_id,
        subscription=subscription,
    )
    
    log.info("subscription_updated_processed", user_id=user_id)


async def _handle_subscription_deleted(subscription: Dict[str, Any]) -> None:
    """
    Handle customer.subscription.deleted event.
    
    This fires when a subscription is fully canceled (not just scheduled).
    We downgrade the user to free tier.
    """
    subscription_id = subscription.get("id")
    customer_id = subscription.get("customer")
    
    log = logger.bind(subscription_id=subscription_id)
    
    db = get_database()
    now = int(time.time())
    
    # Find user by subscription ID
    query = "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = :subscription_id"
    result = await db.fetch_one(query=query, values={"subscription_id": subscription_id})
    
    if not result:
        log.warning("subscription_deleted_not_found", subscription_id=subscription_id)
        return
    
    user_id = result["user_id"]
    
    # Update subscription record
    query = """
        UPDATE subscriptions 
        SET status = :status, updated_at = :updated_at
        WHERE stripe_subscription_id = :subscription_id
    """
    await db.execute(
        query=query,
        values={
            "status": SubscriptionStatus.CANCELED.value,
            "subscription_id": subscription_id,
            "updated_at": now,
        }
    )
    
    # Downgrade user to free tier
    query = """
        UPDATE user_settings 
        SET subscription_tier = :tier, subscription_status = :status, updated_at = :updated_at
        WHERE user_id = :user_id
    """
    await db.execute(
        query=query,
        values={
            "tier": "free",
            "status": "canceled",
            "user_id": user_id,
            "updated_at": now,
        }
    )
    
    log.info("subscription_deleted_processed", user_id=user_id)


async def _update_subscription_record(
    user_id: str,
    customer_id: str,
    subscription_id: str,
    subscription: Any,
) -> None:
    """
    Update subscription record with latest Stripe data.
    
    Also updates user_settings.subscription_tier to match.
    """
    db = get_database()
    now = int(time.time())
    
    # Extract subscription data
    status = subscription.get("status", "inactive")
    current_period_start = subscription.get("current_period_start")
    current_period_end = subscription.get("current_period_end")
    cancel_at_period_end = 1 if subscription.get("cancel_at_period_end") else 0
    
    # Get plan/price ID from subscription items
    plan_id = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        plan_id = items[0].get("price", {}).get("id")
    
    # Map Stripe status to tier
    tier = "pro" if status in ("active", "trialing") else "free"
    
    log = logger.bind(
        user_id=user_id,
        subscription_id=subscription_id,
        status=status,
        tier=tier,
    )
    
    # Upsert subscription record
    upsert_query = """
        INSERT INTO subscriptions (
            user_id, stripe_customer_id, stripe_subscription_id, plan_id,
            status, current_period_start, current_period_end, cancel_at_period_end,
            created_at, updated_at
        ) VALUES (
            :user_id, :customer_id, :subscription_id, :plan_id,
            :status, :period_start, :period_end, :cancel_at_period_end,
            :created_at, :updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            stripe_subscription_id = :subscription_id,
            plan_id = :plan_id,
            status = :status,
            current_period_start = :period_start,
            current_period_end = :period_end,
            cancel_at_period_end = :cancel_at_period_end,
            updated_at = :updated_at
    """
    await db.execute(
        query=upsert_query,
        values={
            "user_id": user_id,
            "customer_id": customer_id,
            "subscription_id": subscription_id,
            "plan_id": plan_id,
            "status": status,
            "period_start": current_period_start,
            "period_end": current_period_end,
            "cancel_at_period_end": cancel_at_period_end,
            "created_at": now,
            "updated_at": now,
        }
    )
    
    # Update user_settings tier
    tier_query = """
        UPDATE user_settings 
        SET subscription_tier = :tier, 
            subscription_status = :status,
            subscription_expires_at = :expires_at,
            updated_at = :updated_at
        WHERE user_id = :user_id
    """
    await db.execute(
        query=tier_query,
        values={
            "tier": tier,
            "status": status,
            "expires_at": current_period_end,
            "user_id": user_id,
            "updated_at": now,
        }
    )
    
    log.info("subscription_record_updated")


# =============================================================================
# SUBSCRIPTION QUERIES
# =============================================================================

async def get_subscription_info(user_id: str) -> Optional[SubscriptionInfo]:
    """
    Get subscription information for a user.
    
    Args:
        user_id: Clerk user ID
        
    Returns:
        SubscriptionInfo or None if no subscription exists
    """
    db = get_database()
    
    query = """
        SELECT 
            user_id, stripe_customer_id, stripe_subscription_id, plan_id,
            status, current_period_end, cancel_at_period_end
        FROM subscriptions 
        WHERE user_id = :user_id
    """
    result = await db.fetch_one(query=query, values={"user_id": user_id})
    
    if not result:
        return None
    
    return SubscriptionInfo(
        user_id=result["user_id"],
        stripe_customer_id=result["stripe_customer_id"],
        stripe_subscription_id=result["stripe_subscription_id"],
        plan_id=result["plan_id"],
        status=SubscriptionStatus(result["status"]) if result["status"] else SubscriptionStatus.INACTIVE,
        current_period_end=result["current_period_end"],
        cancel_at_period_end=bool(result["cancel_at_period_end"]),
    )


async def create_billing_portal_session(user_id: str, return_url: str) -> str:
    """
    Create a Stripe Billing Portal session for self-service management.
    
    Users can:
    - Update payment method
    - View invoices
    - Cancel subscription
    
    Args:
        user_id: Clerk user ID
        return_url: URL to redirect after portal session
        
    Returns:
        Billing portal URL
    """
    _ensure_stripe_configured()
    
    log = logger.bind(user_id=user_id)
    
    # Get customer ID
    db = get_database()
    query = "SELECT stripe_customer_id FROM subscriptions WHERE user_id = :user_id"
    result = await db.fetch_one(query=query, values={"user_id": user_id})
    
    if not result or not result["stripe_customer_id"]:
        raise CustomerNotFoundError(f"No Stripe customer found for user {user_id}")
    
    try:
        session = stripe.billing_portal.Session.create(
            customer=result["stripe_customer_id"],
            return_url=return_url,
        )
        
        log.info("billing_portal_session_created")
        return session.url
        
    except stripe.StripeError as e:
        log.error("billing_portal_session_failed", error=str(e))
        raise PaymentServiceError(f"Failed to create billing portal session: {e}")
