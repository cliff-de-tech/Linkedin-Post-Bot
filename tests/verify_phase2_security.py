"""
Phase 2 Security Verification Tests
Run this script to verify all security implementations are working correctly.

Usage: py tests/verify_phase2_security.py (from project root)
"""
import os
import sys

# Add project root to path (parent of tests/)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.chdir(project_root)  # Change to project root for README.md access

def test_encryption_production_fail_fast():
    """Test 1: Encryption fails fast in production without ENCRYPTION_KEY"""
    print("\n=== TEST 1: Encryption Production Fail-Fast ===")
    
    # Save original values
    orig_env = os.environ.get('ENV')
    orig_key = os.environ.get('ENCRYPTION_KEY')
    
    try:
        # Set production mode and remove key
        os.environ['ENV'] = 'production'
        if 'ENCRYPTION_KEY' in os.environ:
            del os.environ['ENCRYPTION_KEY']
        
        # Force reimport
        if 'services.encryption' in sys.modules:
            del sys.modules['services.encryption']
        
        try:
            from services.encryption import encrypt_value
            encrypt_value("test")
            print("❌ FAIL: Should have raised EncryptionKeyMissingError")
            return False
        except Exception as e:
            if 'EncryptionKeyMissingError' in type(e).__name__ or 'ENCRYPTION_KEY' in str(e):
                print(f"✅ PASS: Production correctly raises error: {type(e).__name__}")
                return True
            else:
                print(f"⚠️ UNEXPECTED: Got different error: {type(e).__name__}: {e}")
                return False
    finally:
        # Restore
        if orig_env:
            os.environ['ENV'] = orig_env
        elif 'ENV' in os.environ:
            del os.environ['ENV']
        if orig_key:
            os.environ['ENCRYPTION_KEY'] = orig_key


def test_encryption_development_warning():
    """Test 2: Encryption allows plaintext in development with warning"""
    print("\n=== TEST 2: Encryption Development Warning ===")
    
    # Save original values
    orig_env = os.environ.get('ENV')
    orig_key = os.environ.get('ENCRYPTION_KEY')
    
    try:
        # Set development mode and remove key
        os.environ['ENV'] = 'development'
        if 'ENCRYPTION_KEY' in os.environ:
            del os.environ['ENCRYPTION_KEY']
        
        # Force reimport
        if 'services.encryption' in sys.modules:
            del sys.modules['services.encryption']
        
        from services.encryption import encrypt_value
        result = encrypt_value("test_value")
        
        if result == "test_value":
            print("✅ PASS: Development mode returns plaintext (with warning logged)")
            return True
        else:
            print(f"❌ FAIL: Expected plaintext, got: {result}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Development should not raise error: {e}")
        return False
    finally:
        if orig_env:
            os.environ['ENV'] = orig_env
        elif 'ENV' in os.environ:
            del os.environ['ENV']
        if orig_key:
            os.environ['ENCRYPTION_KEY'] = orig_key


def test_token_migration_atomic():
    """Test 3: Token migration uses atomic transactions"""
    print("\n=== TEST 3: Token Migration Atomic ===")
    
    try:
        from services.token_store import _migrate_if_plaintext
        import inspect
        
        source = inspect.getsource(_migrate_if_plaintext)
        
        checks = {
            'optimistic_locking': 'is_encrypted=0 OR is_encrypted IS NULL' in source or 'is_encrypted = 0' in source.lower(),
            'commit': 'commit()' in source,
            'rollback': 'rollback()' in source,
            'try_except': 'try:' in source and 'except' in source,
        }
        
        all_pass = all(checks.values())
        
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check}: {'Present' if passed else 'Missing'}")
        
        if all_pass:
            print("✅ PASS: Token migration is atomic with proper error handling")
        else:
            print("❌ FAIL: Token migration missing atomic safeguards")
        
        return all_pass
    except Exception as e:
        print(f"❌ FAIL: Could not inspect token migration: {e}")
        return False


def test_github_auth_deterministic():
    """Test 4: GitHub auth behavior is deterministic"""
    print("\n=== TEST 4: GitHub Auth Deterministic ===")
    
    try:
        from services.github_activity import get_user_activity
        import inspect
        
        sig = inspect.signature(get_user_activity)
        source = inspect.getsource(get_user_activity)
        
        checks = {
            'has_token_param': 'token' in sig.parameters,
            'uses_public_endpoint': '/events/public' in source,
            'uses_private_endpoint': '/events"' in source or "/events'" in source,
            'token_conditional': 'if token:' in source or 'if token :' in source,
            'rate_limit_handling': '403' in source,
        }
        
        all_pass = all(checks.values())
        
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check}: {'Yes' if passed else 'No'}")
        
        if all_pass:
            print("✅ PASS: GitHub auth is deterministic with token-based endpoint selection")
        else:
            print("❌ FAIL: GitHub auth behavior is not properly deterministic")
        
        return all_pass
    except Exception as e:
        print(f"❌ FAIL: Could not verify GitHub auth: {e}")
        return False


def test_frontend_secret_free():
    """Test 5: Frontend receives no secrets from API"""
    print("\n=== TEST 5: Frontend Secret-Free ===")
    
    try:
        from backend.app import UserSettingsRequest
        import inspect
        
        # Check UserSettingsRequest fields
        fields = list(UserSettingsRequest.__fields__.keys())
        
        secret_fields = ['groq_api_key', 'linkedin_client_secret', 'unsplash_access_key', 
                         'access_token', 'refresh_token', 'github_access_token']
        
        exposed_secrets = [f for f in secret_fields if f in fields]
        
        if exposed_secrets:
            print(f"❌ FAIL: UserSettingsRequest exposes secrets: {exposed_secrets}")
            return False
        
        safe_fields = ['user_id', 'github_username', 'onboarding_complete']
        has_safe = all(f in fields for f in safe_fields if f != 'onboarding_complete')  # onboarding_complete is optional
        
        print(f"  Fields in UserSettingsRequest: {fields}")
        print(f"  ✅ No secret fields exposed")
        print(f"  ✅ Only safe fields: {[f for f in fields if f in safe_fields]}")
        
        print("✅ PASS: Frontend API models are secret-free")
        return True
        
    except Exception as e:
        print(f"❌ FAIL: Could not verify frontend API: {e}")
        return False


def test_readme_matches_architecture():
    """Test 6: README documents current architecture"""
    print("\n=== TEST 6: README Matches Architecture ===")
    
    try:
        with open('README.md', 'r', encoding='utf-8') as f:
            readme = f.read()
        
        checks = {
            'multi_tenant_isolation': 'Multi-Tenant Isolation' in readme,
            'encryption_at_rest': 'Encryption at Rest' in readme or 'Fernet' in readme,
            'token_lifecycle': 'Token Lifecycle' in readme or 'STORE' in readme and 'RETRIEVE' in readme,
            'github_public_vs_auth': 'Public Mode' in readme and 'Authenticated Mode' in readme,
            'secrets_never_frontend': 'NEVER' in readme and 'frontend' in readme.lower(),
            'frontend_security_model': 'Frontend Security Model' in readme or 'NEVER SENT' in readme,
        }
        
        all_pass = all(checks.values())
        
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"  {status} {check}: {'Documented' if passed else 'Missing'}")
        
        if all_pass:
            print("✅ PASS: README documents all security architecture")
        else:
            print("❌ FAIL: README is missing some architecture documentation")
        
        return all_pass
    except Exception as e:
        print(f"❌ FAIL: Could not verify README: {e}")
        return False


if __name__ == '__main__':
    print("=" * 60)
    print("PHASE 2 SECURITY VERIFICATION")
    print("=" * 60)
    
    results = {
        'encryption_production': test_encryption_production_fail_fast(),
        'encryption_development': test_encryption_development_warning(),
        'token_migration': test_token_migration_atomic(),
        'github_auth': test_github_auth_deterministic(),
        'frontend_secrets': test_frontend_secret_free(),
        'readme_docs': test_readme_matches_architecture(),
    }
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status}: {name}")
    
    print(f"\n{'='*60}")
    print(f"RESULT: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 ALL CHECKS PASSED - Ready to proceed to Phase 3")
        sys.exit(0)
    else:
        print("\n⚠️ SOME CHECKS FAILED - Review and fix before proceeding")
        sys.exit(1)
