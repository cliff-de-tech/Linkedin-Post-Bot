"""
Encryption Service for Secure Token Storage

Provides symmetric encryption for sensitive user-scoped tokens using Fernet.

ENCRYPTION SCOPE (User-Scoped Tokens ONLY):
    - linkedin_access_token
    - linkedin_refresh_token  
    - github_access_token (optional)

NOT ENCRYPTED (App-Level Secrets - ENV-ONLY):
    - GROQ_API_KEY
    - LINKEDIN_CLIENT_SECRET
    - UNSPLASH_ACCESS_KEY
    - GITHUB_TOKEN
    These must NEVER be stored in the database.

ENCRYPTION KEY:
    - Loaded from ENCRYPTION_KEY environment variable
    - Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    - Must be 32 bytes, URL-safe base64-encoded

ENVIRONMENT BEHAVIOR:
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ ENV=development (or unset):                                              │
    │   - ENCRYPTION_KEY missing: WARNING logged, plaintext storage allowed   │
    │   - This enables local development without encryption setup             │
    │                                                                          │
    │ ENV=production:                                                          │
    │   - ENCRYPTION_KEY missing: RUNTIME ERROR, application FAILS TO START   │
    │   - This prevents ANY possibility of plaintext token storage            │
    │   - This is a SECURITY REQUIREMENT, not a bug                           │
    └─────────────────────────────────────────────────────────────────────────┘

SECURITY NOTES:
    - Fernet provides AES-128-CBC encryption with HMAC authentication
    - Each encrypted value includes a timestamp for key rotation support
    - Production MUST have ENCRYPTION_KEY set - no exceptions
    - Encrypted values are prefixed with "ENC:" for identification
"""

import os
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# ENVIRONMENT CONFIGURATION
# =============================================================================

# SECURITY: Determine environment mode
# - "production" = strict mode, encryption required
# - "development" or unset = permissive mode for local dev
ENV = os.getenv('ENV', 'development').lower()
IS_PRODUCTION = ENV == 'production'

# Load encryption key from environment
# SECURITY: This key must be kept secret and never committed to version control
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', '')

# Lazy-loaded Fernet instance
_fernet = None
_initialization_checked = False


# =============================================================================
# PRODUCTION SAFETY CHECK
# =============================================================================

class EncryptionKeyMissingError(Exception):
    """
    Raised when ENCRYPTION_KEY is missing in production.
    
    This is a FATAL error - the application should NOT start without encryption
    in production environments. This prevents any possibility of storing
    sensitive tokens in plaintext.
    """
    pass


def _check_encryption_requirements():
    """
    Validate encryption requirements based on environment.
    
    PRODUCTION BEHAVIOR:
        - If ENCRYPTION_KEY is missing, raises EncryptionKeyMissingError
        - Application WILL NOT START - this is intentional
        - Tokens must NEVER be stored in plaintext in production
    
    DEVELOPMENT BEHAVIOR:
        - If ENCRYPTION_KEY is missing, logs a WARNING
        - Allows plaintext storage for local development convenience
        - Developer is reminded to set the key before deploying
    
    This function is called once on first encryption/decryption attempt.
    """
    global _initialization_checked
    
    if _initialization_checked:
        return
    
    _initialization_checked = True
    
    if not ENCRYPTION_KEY:
        if IS_PRODUCTION:
            # ═══════════════════════════════════════════════════════════════════
            # PRODUCTION FAIL-FAST: Missing ENCRYPTION_KEY is a FATAL error
            # 
            # WHY THIS EXISTS:
            # - Tokens stored in plaintext are a critical security vulnerability
            # - In production, there is NO acceptable reason to skip encryption
            # - Failing fast ensures the issue is discovered immediately
            # - This prevents silent data exposure that could go unnoticed
            # ═══════════════════════════════════════════════════════════════════
            error_msg = (
                "\n"
                "╔══════════════════════════════════════════════════════════════════╗\n"
                "║  FATAL: ENCRYPTION_KEY environment variable is not set           ║\n"
                "║                                                                  ║\n"
                "║  In production (ENV=production), encryption is REQUIRED.         ║\n"
                "║  Tokens cannot be stored in plaintext.                           ║\n"
                "║                                                                  ║\n"
                "║  Fix: Set ENCRYPTION_KEY in your environment:                    ║\n"
                "║       python -c \"from cryptography.fernet import Fernet;         ║\n"
                "║                   print(Fernet.generate_key().decode())\"         ║\n"
                "║                                                                  ║\n"
                "║  Then add to your .env or environment:                           ║\n"
                "║       ENCRYPTION_KEY=<generated_key>                             ║\n"
                "╚══════════════════════════════════════════════════════════════════╝\n"
            )
            logger.critical(error_msg)
            raise EncryptionKeyMissingError(error_msg)
        else:
            # ═══════════════════════════════════════════════════════════════════
            # DEVELOPMENT FALLBACK: Plaintext storage allowed with warning
            # 
            # WHY THIS EXISTS:
            # - Local development should work without complex setup
            # - Developers can iterate quickly without encryption overhead
            # - The warning reminds developers to configure before production
            # 
            # IMPORTANT: This ONLY applies when ENV != 'production'
            # ═══════════════════════════════════════════════════════════════════
            logger.warning(
                "\n"
                "⚠️  ENCRYPTION_KEY not set (ENV=%s)\n"
                "   Tokens will be stored in PLAINTEXT - acceptable for development only.\n"
                "   Before deploying to production:\n"
                "   1. Generate a key: python services/encryption.py\n"
                "   2. Add to .env: ENCRYPTION_KEY=<key>\n"
                "   3. Set ENV=production\n",
                ENV
            )


def _get_fernet():
    """
    Get or create the Fernet encryption instance.
    
    Returns:
        Fernet instance or None if key not configured (dev mode only)
        
    Raises:
        EncryptionKeyMissingError: If in production and key is missing
    """
    global _fernet
    
    # Check requirements on first call
    _check_encryption_requirements()
    
    if _fernet is not None:
        return _fernet
    
    if not ENCRYPTION_KEY:
        # Only reachable in development mode (production would have raised)
        return None
    
    try:
        from cryptography.fernet import Fernet
        _fernet = Fernet(ENCRYPTION_KEY.encode())
        return _fernet
    except Exception as e:
        if IS_PRODUCTION:
            raise EncryptionKeyMissingError(f"Invalid ENCRYPTION_KEY: {e}")
        logger.error(f"Failed to initialize encryption: {e}")
        return None


# =============================================================================
# ENCRYPTION / DECRYPTION FUNCTIONS
# =============================================================================

def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a plaintext string value.
    
    Args:
        plaintext: The sensitive value to encrypt
        
    Returns:
        Base64-encoded encrypted string prefixed with "ENC:", 
        or original plaintext in development mode without key
        
    Raises:
        EncryptionKeyMissingError: If in production and encryption unavailable
        
    SECURITY:
        - In production: ALWAYS encrypts, fails if can't
        - In development: Falls back to plaintext with warning
        - Empty/None values return empty string
    """
    if not plaintext:
        return ''
    
    fernet = _get_fernet()
    
    if not fernet:
        # ─────────────────────────────────────────────────────────────────────
        # DEV-ONLY FALLBACK: Return plaintext
        # This code path is UNREACHABLE in production (would have raised)
        # ─────────────────────────────────────────────────────────────────────
        return plaintext
    
    try:
        encrypted = fernet.encrypt(plaintext.encode())
        # Prefix with ENC: to identify encrypted values
        return f"ENC:{encrypted.decode()}"
    except Exception as e:
        if IS_PRODUCTION:
            raise EncryptionKeyMissingError(f"Encryption failed in production: {e}")
        logger.error(f"Encryption failed: {e}")
        return plaintext


def decrypt_value(encrypted: str) -> str:
    """
    Decrypt an encrypted string value.
    
    Args:
        encrypted: The encrypted value (with ENC: prefix) or plaintext
        
    Returns:
        Decrypted plaintext string
        
    Raises:
        EncryptionKeyMissingError: If in production and decryption unavailable
        
    SECURITY:
        - Handles both encrypted (ENC: prefix) and legacy plaintext values
        - In production: Requires encryption key for encrypted values
        - Decryption failures in production raise errors (fail secure)
    """
    if not encrypted:
        return ''
    
    # Check if value is encrypted (has ENC: prefix)
    if not encrypted.startswith('ENC:'):
        # Legacy plaintext value - return as-is for auto-migration
        # The caller should re-encrypt and save this value
        return encrypted
    
    fernet = _get_fernet()
    
    if not fernet:
        if IS_PRODUCTION:
            raise EncryptionKeyMissingError(
                "Cannot decrypt: ENCRYPTION_KEY not set in production"
            )
        logger.error("Cannot decrypt: ENCRYPTION_KEY not set")
        return ''
    
    try:
        # Remove ENC: prefix and decrypt
        encrypted_data = encrypted[4:]  # Remove "ENC:" prefix
        decrypted = fernet.decrypt(encrypted_data.encode())
        return decrypted.decode()
    except Exception as e:
        if IS_PRODUCTION:
            raise EncryptionKeyMissingError(f"Decryption failed in production: {e}")
        logger.error(f"Decryption failed: {e}")
        return ''


def is_encrypted(value: str) -> bool:
    """
    Check if a value is encrypted (has ENC: prefix).
    
    Args:
        value: The value to check
        
    Returns:
        True if encrypted, False if plaintext or empty
    """
    return bool(value and value.startswith('ENC:'))


def mask_token(token: str, visible_chars: int = 8) -> str:
    """
    Create a masked version of a token for display.
    
    Args:
        token: The token to mask (can be encrypted or plaintext)
        visible_chars: Number of characters to show at start and end
        
    Returns:
        Masked string like "AQXr...Xw" or "••••••••" if too short/encrypted
        
    SECURITY: 
        - NEVER returns the actual token value
        - Used for frontend display only
        - Safe to return to any caller
    """
    if not token:
        return ''
    
    # If encrypted, show that it's set but masked
    if is_encrypted(token):
        return '••••••••'
    
    # For plaintext (legacy), mask it
    if len(token) <= visible_chars * 2:
        return '••••••••'
    
    return f"{token[:visible_chars]}...{token[-4:]}"


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_environment_mode() -> str:
    """Return current environment mode for diagnostics."""
    return 'production' if IS_PRODUCTION else 'development'


def is_encryption_enabled() -> bool:
    """Check if encryption is properly configured."""
    return bool(ENCRYPTION_KEY)


def generate_key() -> str:
    """
    Generate a new Fernet encryption key.
    
    Returns:
        URL-safe base64-encoded 32-byte key
        
    Usage:
        Add to .env: ENCRYPTION_KEY=<generated_key>
    """
    from cryptography.fernet import Fernet
    return Fernet.generate_key().decode()


# =============================================================================
# CLI UTILITY
# =============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("ENCRYPTION KEY GENERATOR")
    print("=" * 60)
    print()
    print("Generated ENCRYPTION_KEY:")
    print(generate_key())
    print()
    print("Add this to your .env file:")
    print("  ENCRYPTION_KEY=<key_above>")
    print("  ENV=production  # Required for production mode")
    print()
    print("Current mode:", get_environment_mode())
    print("Encryption configured:", is_encryption_enabled())
    print("=" * 60)
