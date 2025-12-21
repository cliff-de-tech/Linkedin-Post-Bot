# Security Policy

This document explains how LinkedIn Post Bot handles security, authentication, and sensitive data.

---

## Table of Contents

- [Secrets Handling](#secrets-handling)
- [OAuth Flow](#oauth-flow)
- [API Key Storage](#api-key-storage)
- [Rate Limiting](#rate-limiting)
- [Responsible Usage](#responsible-usage)
- [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Secrets Handling

### What We Store

| Data | Storage | Encryption |
|------|---------|------------|
| LinkedIn OAuth tokens | SQLite (`backend_tokens.db`) | At rest (DB-level) |
| User API keys (Groq, Unsplash) | SQLite (`user_settings.db`) | At rest (DB-level) |
| LinkedIn Client ID/Secret | User settings DB | At rest (DB-level) |

### What We NEVER Do

- **Never log secrets** — Access tokens, API keys, and client secrets are never printed to console or logs
- **Never expose secrets via API** — Settings endpoint returns masked versions (e.g., `gsk_xxxx...xxxx`)
- **Never transmit secrets unnecessarily** — Tokens are only sent to their respective API providers
- **Never store passwords** — We use OAuth; users authenticate directly with LinkedIn

### Environment Variables

All sensitive configuration is loaded from environment variables:

```bash
# Backend (.env)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
GROQ_API_KEY=...
UNSPLASH_ACCESS_KEY=...

# Frontend (web/.env.local)
CLERK_SECRET_KEY=...
```

> **Important**: Never commit `.env` files. The `.gitignore` excludes all environment files and database files.

---

## OAuth Flow

### LinkedIn OAuth 2.0

The application uses LinkedIn's official OAuth 2.0 authorization code flow:

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  User    │         │  App     │         │ LinkedIn │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                     │
     │ 1. Click "Connect" │                     │
     │───────────────────>│                     │
     │                    │                     │
     │                    │ 2. Redirect to      │
     │                    │    LinkedIn OAuth   │
     │<───────────────────│────────────────────>│
     │                    │                     │
     │ 3. User grants     │                     │
     │    permission      │                     │
     │───────────────────────────────────────-->│
     │                    │                     │
     │                    │ 4. LinkedIn sends   │
     │                    │    auth code        │
     │<─────────────────────────────────────────│
     │                    │                     │
     │ 5. Callback to app │                     │
     │───────────────────>│                     │
     │                    │ 6. Exchange code    │
     │                    │    for token        │
     │                    │<───────────────────>│
     │                    │                     │
     │                    │ 7. Store token      │
     │                    │    securely         │
     │                    │                     │
```

### Required OAuth Scopes

| Scope | Purpose | Required |
|-------|---------|----------|
| `openid` | OpenID Connect user info | ✅ Yes |
| `profile` | Basic profile information | ✅ Yes |
| `email` | Email address | Optional |
| `w_member_social` | Create posts on behalf of user | ✅ Yes |

### Token Lifecycle

1. **Acquisition**: Token obtained via OAuth callback
2. **Storage**: Encrypted in SQLite with expiration timestamp
3. **Refresh**: Automatic refresh before expiry (60-second buffer)
4. **Revocation**: Users can disconnect via LinkedIn settings

### Per-User Credentials

Each user stores their own:
- LinkedIn Client ID & Secret (from their own LinkedIn Developer App)
- Groq API Key
- Unsplash Access Key

This ensures:
- Multi-tenant isolation
- No shared API quotas
- Users control their own credentials

---

## API Key Storage

### In-Transit

- All API calls use HTTPS
- JWT tokens verified on each request (Clerk authentication)
- CORS restricts origins to authorized frontends

### At-Rest

- SQLite databases stored locally
- Database files excluded from Git
- Production: Use encrypted volumes or managed databases

### Masking in UI

The settings endpoint returns masked API keys:

```json
{
  "groq_api_key": "gsk_xxxx...xxxx",
  "linkedin_client_secret": "••••••••"
}
```

Full keys are never sent back to the client after initial save.

---

## Rate Limiting

The application implements rate limiting to prevent abuse:

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Post Generation (`/generate-preview`) | 10 requests | 1 hour |
| Publishing (`/api/publish/full`) | 5 requests | 1 hour |
| General API | 100 requests | 1 hour |

Rate limits are enforced per-user (by Clerk user ID).

### Implementation

See `services/middleware.py` for the `RateLimiter` class:

```python
from services.middleware import post_generation_limiter, rate_limit

@rate_limit(post_generation_limiter)
async def generate_preview(user_id: str, ...):
    ...
```

---

## Responsible Usage

### What This Tool Is For

✅ Generating LinkedIn posts from your own GitHub activity  
✅ Publishing content to your own LinkedIn profile  
✅ Saving time on content creation  

### What This Tool Is NOT For

❌ Automated mass posting or spam  
❌ Posting on behalf of others without consent  
❌ Scraping LinkedIn data  
❌ Bypassing LinkedIn rate limits  
❌ Any activity that violates LinkedIn's Terms of Service  

### LinkedIn Terms Compliance

This application:
- Uses only LinkedIn's official APIs
- Requires explicit user authorization (OAuth)
- Does not automate engagement (likes, comments)
- Does not use browser automation or scraping
- Respects LinkedIn's API rate limits

> **Warning**: Excessive posting or suspicious activity may result in LinkedIn restricting your account. Use responsibly.

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do NOT open a public issue**
2. Email the maintainer directly with details
3. Include steps to reproduce if possible
4. Allow reasonable time for a fix before disclosure

We take security seriously and will respond promptly.

---

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No secrets logged to console (use masked versions if needed)
- [ ] No secrets returned in API responses (mask or omit)
- [ ] Input validation on all user-provided data
- [ ] Rate limiting on resource-intensive endpoints
- [ ] CORS configuration restricts to known origins
- [ ] SQL queries use parameterization (no string concatenation)
- [ ] OAuth tokens stored with expiration handling

---

**Last updated**: December 2024
