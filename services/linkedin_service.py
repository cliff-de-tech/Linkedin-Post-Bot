import os
import requests

LINKEDIN_ACCESS_TOKEN = os.getenv('LINKEDIN_ACCESS_TOKEN', '')
LINKEDIN_USER_URN = os.getenv('LINKEDIN_USER_URN', '')


def upload_image_to_linkedin(image_data, access_token: str = None, linkedin_user_urn: str = None):
    """Upload an image to LinkedIn and return the asset URN"""
    print(f"📤 Uploading image to LinkedIn...")
    try:
        token = access_token or LINKEDIN_ACCESS_TOKEN
        owner = linkedin_user_urn or LINKEDIN_USER_URN
        if not token or not owner:
            raise RuntimeError('Missing access_token or linkedin_user_urn for upload')

        register_url = "https://api.linkedin.com/v2/assets?action=registerUpload"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        }

        register_data = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": f"urn:li:person:{LINKEDIN_USER_URN}",
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent"
                    }
                ]
            }
        }

        response = requests.post(register_url, headers=headers, json=register_data)
        if response.status_code != 200:
            print(f"❌ Failed to register upload: {response.status_code}")
            print(response.text)
            return None

        register_response = response.json()
        asset_urn = register_response['value']['asset']
        upload_url = register_response['value']['uploadMechanism']['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']['uploadUrl']

        print("⬆️  Uploading to LinkedIn...")
        upload_headers = {'Authorization': f'Bearer {token}'}
        upload_response = requests.put(upload_url, headers=upload_headers, data=image_data)

        if upload_response.status_code in [200, 201]:
            print(f"✅ Image uploaded successfully: {asset_urn}")
            return asset_urn
        else:
            print(f"❌ Failed to upload image: {upload_response.status_code}")
            print(upload_response.text)
            return None
    except Exception as e:
        print(f"⚠️  Error uploading image: {e}")
        return None


def post_to_linkedin(message_text, image_asset_urn=None, access_token: str = None, linkedin_user_urn: str = None):
    """Post to LinkedIn with optional image"""
    url = "https://api.linkedin.com/v2/ugcPosts"
    token = access_token or LINKEDIN_ACCESS_TOKEN
    owner = linkedin_user_urn or LINKEDIN_USER_URN
    if not token or not owner:
        raise RuntimeError('Missing access_token or linkedin_user_urn for posting')

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
    }

    if image_asset_urn:
        post_data = {
            "author": f"urn:li:person:{LINKEDIN_USER_URN}",
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
        post_data = {
            "author": f"urn:li:person:{LINKEDIN_USER_URN}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": message_text},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
        }

    print(f"🤖 Posting: '{message_text[:30]}...'")
    response = requests.post(url, headers=headers, json=post_data)
    if response.status_code == 201:
        print("\n✅ SUCCESS! Post is live.")
    else:
        print(f"\n❌ FAILED. {response.status_code}")
        print(response.text)
