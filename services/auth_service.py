import os
import time
import requests
from urllib.parse import quote
from services.token_store import save_token, get_token_by_urn

CLIENT_ID = os.getenv('LINKEDIN_CLIENT_ID', '')
CLIENT_SECRET = os.getenv('LINKEDIN_CLIENT_SECRET', '')
SCOPE = os.getenv('LINKEDIN_OAUTH_SCOPE', 'r_liteprofile r_emailaddress w_member_social')


def get_authorize_url(redirect_uri: str, state: str):
    """Return the LinkedIn authorization URL to redirect users to."""
    if not CLIENT_ID:
        raise RuntimeError('LINKEDIN_CLIENT_ID not set')
    params = {
        'response_type': 'code',
        'client_id': CLIENT_ID,
        'redirect_uri': redirect_uri,
        'scope': SCOPE,
        'state': state
    }
    q = '&'.join([f"{k}={quote(v)}" for k, v in params.items()])
    return f"https://www.linkedin.com/oauth/v2/authorization?{q}"


def exchange_code_for_token(code: str, redirect_uri: str):
    """Exchange authorization code for access token and store it in the DB."""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set')

    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirect_uri,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    token_data = resp.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')

    # Use access token to get user id so we can build the URN
    me_url = 'https://api.linkedin.com/v2/me'
    me_resp = requests.get(me_url, headers={'Authorization': f'Bearer {access_token}'}, timeout=10)
    me_resp.raise_for_status()
    me = me_resp.json()
    linkedin_id = me.get('id')
    if not linkedin_id:
        raise RuntimeError('Failed to fetch LinkedIn user id')
    linkedin_user_urn = f'urn:li:person:{linkedin_id}'

    expires_at = int(time.time()) + int(expires_in) if expires_in else None
    save_token(linkedin_user_urn, access_token, refresh_token=None, expires_at=expires_at)

    return {
        'linkedin_user_urn': linkedin_user_urn,
        'access_token': access_token,
        'expires_at': expires_at
    }


def refresh_access_token(refresh_token: str):
    """Use refresh token to obtain a new access token and store it."""
    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError('LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET not set')

    token_url = 'https://www.linkedin.com/oauth/v2/accessToken'
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    resp = requests.post(token_url, data=data, headers=headers, timeout=10)
    resp.raise_for_status()
    token_data = resp.json()
    access_token = token_data.get('access_token')
    expires_in = token_data.get('expires_in')
    new_refresh = token_data.get('refresh_token', refresh_token)

    expires_at = int(time.time()) + int(expires_in) if expires_in else None

    return {
        'access_token': access_token,
        'refresh_token': new_refresh,
        'expires_at': expires_at
    }


def get_access_token_for_urn(linkedin_user_urn: str, refresh_buffer: int = 60):
    """Return a valid access token for the given URN, refreshing if near expiry."""
    token_row = get_token_by_urn(linkedin_user_urn)
    if not token_row:
        raise RuntimeError('No token found for this linkedin_user_urn')

    access_token = token_row.get('access_token')
    refresh_token = token_row.get('refresh_token')
    expires_at = token_row.get('expires_at')

    now = int(time.time())
    if expires_at and (expires_at - now) <= refresh_buffer:
        if not refresh_token:
            raise RuntimeError('No refresh token available to refresh access token')
        refreshed = refresh_access_token(refresh_token)
        # Save refreshed tokens
        save_token(linkedin_user_urn, refreshed['access_token'], refreshed.get('refresh_token'), refreshed.get('expires_at'))
        return refreshed['access_token']

    return access_token
