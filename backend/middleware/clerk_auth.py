"""
Clerk JWT Authentication Middleware for FastAPI

This module provides JWT verification for Clerk authentication tokens.
It validates tokens using Clerk's JWKS (JSON Web Key Set) endpoint.
"""

import os
import jwt
import requests
from functools import lru_cache
from typing import Optional
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Clerk configuration
CLERK_ISSUER = os.getenv('CLERK_ISSUER', '')  # e.g., https://your-clerk-instance.clerk.accounts.dev
CLERK_JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else None

# Security scheme
security = HTTPBearer(auto_error=False)


@lru_cache(maxsize=1)
def get_jwks():
    """Fetch and cache the JWKS from Clerk."""
    if not CLERK_JWKS_URL:
        return None
    try:
        response = requests.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Failed to fetch JWKS: {e}")
        return None


def get_signing_key(token: str):
    """Get the signing key for a given token from JWKS."""
    jwks = get_jwks()
    if not jwks:
        return None
    
    try:
        # Decode header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        
        # Find matching key in JWKS
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(key)
        
        return None
    except Exception as e:
        print(f"Error getting signing key: {e}")
        return None


def verify_clerk_token(token: str) -> Optional[dict]:
    """
    Verify a Clerk JWT token and return the decoded payload.
    
    Returns None if verification fails.
    """
    # Dev mode: only if EXPLICITLY enabled AND no issuer configured
    DEV_MODE = os.getenv('DEV_MODE', 'false').lower() == 'true'
    if not CLERK_ISSUER and DEV_MODE:
        print("⚠️  DEV MODE: Clerk not configured, using test user")
        return {"sub": "dev_user", "dev_mode": True}
    
    signing_key = get_signing_key(token)
    if not signing_key:
        return None
    
    try:
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={
                "verify_aud": False,  # Clerk doesn't always set audience
                "verify_exp": True,
                "verify_iat": True,
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    FastAPI dependency to get the current authenticated user.
    
    Returns the decoded JWT payload if valid, None otherwise.
    Use this for optional authentication (endpoints that work with or without auth).
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = verify_clerk_token(token)
    
    if payload:
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "dev_mode": payload.get("dev_mode", False)
        }
    
    return None


async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    FastAPI dependency that REQUIRES authentication.
    
    Raises HTTPException 401 if not authenticated.
    Use this for protected endpoints.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    token = credentials.credentials
    payload = verify_clerk_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    return {
        "user_id": payload.get("sub"),
        "email": payload.get("email"),
        "dev_mode": payload.get("dev_mode", False)
    }
