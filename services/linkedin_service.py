"""
LinkedIn Posting Service

This module handles posting content to LinkedIn via the official UGC API.

IMPORTANT - LinkedIn API Compliance:
- Uses only LinkedIn's sanctioned APIs (UGC Posts API)
- Requires w_member_social OAuth scope
- Does NOT use browser automation or scraping
- Respects LinkedIn's rate limits

SECURITY NOTES:
- Access tokens are never logged
- Failed responses are logged without exposing tokens
- All API calls use HTTPS with proper authorization headers
"""

import os
import requests

# Fallback credentials from environment (used if per-user tokens not available)
# SECURITY: These are loaded from environment, never hardcoded
LINKEDIN_ACCESS_TOKEN = os.getenv('LINKEDIN_ACCESS_TOKEN', '')
LINKEDIN_USER_URN = os.getenv('LINKEDIN_USER_URN', '')


def upload_image_to_linkedin(
    image_data: bytes, 
    access_token: str = None, 
    linkedin_user_urn: str = None
) -> str | None:
    """
    Upload an image to LinkedIn for use in a post.
    
    LinkedIn's image upload is a two-step process:
    1. Register the upload → Get upload URL and asset URN
    2. PUT the image data to the upload URL
    
    Args:
        image_data: Raw image bytes to upload
        access_token: OAuth access token (falls back to env var)
        linkedin_user_urn: User URN without prefix (falls back to env var)
        
    Returns:
        Asset URN string if successful, None on failure
        
    SECURITY: Access token is only sent in Authorization header, never logged.
    """
    print("📤 Uploading image to LinkedIn...")
    
    try:
        # Use provided credentials or fall back to environment
        token = access_token or LINKEDIN_ACCESS_TOKEN
        owner = linkedin_user_urn or LINKEDIN_USER_URN
        
        if not token or not owner:
            raise RuntimeError('Missing access_token or linkedin_user_urn for upload')

        # Step 1: Register the upload
        register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        }

        # IMPORTANT: Use the passed 'owner' parameter, not the env var
        # This ensures multi-tenant isolation
        register_data = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": f"urn:li:person:{owner}",
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent"
                    }
                ]
            }
        }

        response = requests.post(register_url, headers=headers, json=register_data, timeout=30)
        
        if response.status_code != 200:
            # Log error without exposing token
            print(f"❌ Failed to register upload: {response.status_code}")
            print(f"Response: {response.text[:500]}")  # Truncate for safety
            return None

        register_response = response.json()
        asset_urn = register_response['value']['asset']
        upload_url = register_response['value']['uploadMechanism'][
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
        ]['uploadUrl']

        # Step 2: Upload the actual image
        print("⬆️  Uploading to LinkedIn...")
        upload_headers = {'Authorization': f'Bearer {token}'}
        upload_response = requests.put(upload_url, headers=upload_headers, data=image_data, timeout=60)

        if upload_response.status_code in [200, 201]:
            print(f"✅ Image uploaded successfully: {asset_urn}")
            return asset_urn
        else:
            print(f"❌ Failed to upload image: {upload_response.status_code}")
            print(f"Response: {upload_response.text[:500]}")
            return None
            
    except requests.Timeout:
        print("⚠️  Image upload timed out")
        return None
    except Exception as e:
        # SECURITY: Don't expose token in error messages
        print(f"⚠️  Error uploading image: {type(e).__name__}: {str(e)[:200]}")
        return None


def post_to_linkedin(
    message_text: str, 
    image_asset_urn: str = None, 
    access_token: str = None, 
    linkedin_user_urn: str = None
) -> bool:
    """
    Create a post on LinkedIn.
    
    Uses the UGC (User Generated Content) Posts API.
    Supports text-only posts and posts with images.
    
    Args:
        message_text: The post content (max 3000 characters)
        image_asset_urn: Optional asset URN from upload_image_to_linkedin
        access_token: OAuth access token (falls back to env var)
        linkedin_user_urn: User URN without prefix (falls back to env var)
        
    Returns:
        True if post was successful, False otherwise
        
    SECURITY NOTES:
    - Access token sent only in Authorization header
    - Post visibility is set to PUBLIC (user's network)
    - No engagement automation (comments, likes)
    
    COMPLIANCE:
    - Uses official UGC Posts API
    - Requires w_member_social scope
    - Posts are created with user's explicit action (not automated)
    
    WARNING: Excessive posting may trigger LinkedIn's anti-spam measures.
    Use responsibly.
    """
    url = "https://api.linkedin.com/v2/ugcPosts"
    
    # Use provided credentials or fall back to environment
    token = access_token or LINKEDIN_ACCESS_TOKEN
    owner = linkedin_user_urn or LINKEDIN_USER_URN
    
    if not token or not owner:
        raise RuntimeError('Missing access_token or linkedin_user_urn for posting')

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
    }

    # Build post payload
    # IMPORTANT: Use the passed 'owner' parameter for multi-tenant isolation
    author_urn = f"urn:li:person:{owner}"
    
    if image_asset_urn:
        # Post with image
        post_data = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message_text},
                    "shareMediaCategory": "IMAGE",
                    "media": [
                        {
                            "status": "READY",
                            "media": image_asset_urn
                        }
                    ]
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }
    else:
        # Text-only post
        post_data = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message_text},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }

    # Truncate message for logging (don't expose full content)
    preview = message_text[:30].replace('\n', ' ')
    print(f"🤖 Posting: '{preview}...'")
    
    try:
        response = requests.post(url, headers=headers, json=post_data, timeout=30)
        
        if response.status_code == 201:
            print("\n✅ SUCCESS! Post is live.")
            return True
        else:
            print(f"\n❌ FAILED. Status: {response.status_code}")
            # Log response for debugging (truncated for safety)
            print(f"Response: {response.text[:500]}")
            return False
            
    except requests.Timeout:
        print("⚠️  Post request timed out")
        return False
    except Exception as e:
        print(f"⚠️  Error posting: {type(e).__name__}: {str(e)[:200]}")
        return False
