"""
Webhooks Router
Handles incoming webhooks from external services (Clerk, etc.)

CLERK WEBHOOKS:
- user.deleted: Triggered when a user deletes their account
- user.created: (optional) Track new signups
- user.updated: (optional) Sync profile changes

SECURITY:
- Webhook signature verification using CLERK_WEBHOOK_SECRET
- Rejects requests without valid signatures
- Logs events without exposing sensitive data

SETUP (Clerk Dashboard):
1. Go to Clerk Dashboard → Webhooks → Add Endpoint
2. URL: https://your-api-domain.com/webhooks/clerk
3. Events: user.deleted (required), user.created, user.updated (optional)
4. Copy Signing Secret → Add to .env as CLERK_WEBHOOK_SECRET
"""

import os
import json
import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

# =============================================================================
# ROUTER SETUP
# =============================================================================
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

# Clerk webhook signing secret
CLERK_WEBHOOK_SECRET = os.getenv('CLERK_WEBHOOK_SECRET', '')


def verify_clerk_signature(payload: bytes, headers: dict) -> bool:
    """
    Verify the Clerk webhook signature.
    
    Clerk uses Svix for webhooks, which signs payloads with HMAC-SHA256.
    
    Args:
        payload: Raw request body bytes
        headers: Request headers dict
        
    Returns:
        True if signature is valid, False otherwise
    """
    if not CLERK_WEBHOOK_SECRET:
        print("⚠️  CLERK_WEBHOOK_SECRET not configured - skipping verification in dev mode")
        return True  # Allow in development (remove in production!)
    
    # Svix webhook headers
    svix_id = headers.get('svix-id', '')
    svix_timestamp = headers.get('svix-timestamp', '')
    svix_signature = headers.get('svix-signature', '')
    
    if not all([svix_id, svix_timestamp, svix_signature]):
        print("❌ Missing Svix headers")
        return False
    
    # Construct the signed payload
    signed_payload = f"{svix_id}.{svix_timestamp}.{payload.decode('utf-8')}"
    
    # Compute expected signature
    try:
        # Clerk webhook secrets are base64 encoded after "whsec_"
        secret = CLERK_WEBHOOK_SECRET
        if secret.startswith('whsec_'):
            import base64
            secret = base64.b64decode(secret[6:])
        else:
            secret = secret.encode()
        
        expected_sig = hmac.new(
            secret,
            signed_payload.encode(),
            hashlib.sha256
        ).digest()
        
        import base64
        expected_sig_b64 = base64.b64encode(expected_sig).decode()
        
        # Svix signature format: "v1,<base64_sig>" - may have multiple
        provided_sigs = svix_signature.split(' ')
        for sig in provided_sigs:
            if sig.startswith('v1,'):
                if hmac.compare_digest(sig[3:], expected_sig_b64):
                    return True
        
        return False
    except Exception as e:
        print(f"❌ Signature verification error: {e}")
        return False


@router.post("/clerk")
async def handle_clerk_webhook(request: Request):
    """
    Handle incoming Clerk webhook events.
    
    Supported events:
    - user.deleted: Clean up all user data from databases
    - user.created: (logged only)
    - user.updated: (logged only)
    
    Returns:
        200 OK on success (Clerk retries on non-2xx)
    """
    # Get raw body for signature verification
    body = await request.body()
    headers = dict(request.headers)
    
    # Verify webhook signature
    if not verify_clerk_signature(body, headers):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Parse webhook payload
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    event_type = payload.get('type', '')
    data = payload.get('data', {})
    user_id = data.get('id', '')
    
    print(f"📨 Clerk webhook received: {event_type}")
    
    # Handle user.deleted event
    if event_type == 'user.deleted':
        if not user_id:
            return JSONResponse(
                status_code=400,
                content={"error": "Missing user ID in webhook data"}
            )
        
        # Import and run cleanup
        try:
            from services.user_data_cleanup import delete_all_user_data
            result = delete_all_user_data(user_id)
            
            return JSONResponse(
                status_code=200,
                content={
                    "status": "success",
                    "event": event_type,
                    "message": f"Deleted {result['total']} records",
                    "details": result['deleted']
                }
            )
        except Exception as e:
            print(f"❌ Error cleaning up user data: {e}")
            # Return 200 to prevent Clerk from retrying
            # (the data can be cleaned up manually if needed)
            return JSONResponse(
                status_code=200,
                content={
                    "status": "partial",
                    "event": event_type,
                    "error": str(e)
                }
            )
    
    # Handle user.created (just log)
    elif event_type == 'user.created':
        print(f"👤 New user created: {user_id[:8]}...")
        return JSONResponse(
            status_code=200,
            content={"status": "success", "event": event_type}
        )
    
    # Handle user.updated (just log)
    elif event_type == 'user.updated':
        print(f"👤 User updated: {user_id[:8]}...")
        return JSONResponse(
            status_code=200,
            content={"status": "success", "event": event_type}
        )
    
    # Unknown event type
    else:
        print(f"⚠️  Unhandled webhook event: {event_type}")
        return JSONResponse(
            status_code=200,
            content={"status": "ignored", "event": event_type}
        )
