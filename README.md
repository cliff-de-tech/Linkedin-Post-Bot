# Post Bot

> **Transform your GitHub activity into professional social media content — powered by AI, designed for developers who code more than they post.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/cliff-de-tech/linkedin-post-bot/ci.yml?branch=main&label=build)](https://github.com/cliff-de-tech/linkedin-post-bot/actions)
[![API Contracts](https://img.shields.io/github/actions/workflow/status/cliff-de-tech/linkedin-post-bot/api-contracts.yml?branch=main&label=api%20contracts)](https://github.com/cliff-de-tech/linkedin-post-bot/actions/workflows/api-contracts.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## Why This Tool Exists

Most developers are active on GitHub but invisible on LinkedIn. Writing engaging posts takes time, and consistency is hard. This tool bridges the gap by:

- **Scanning your GitHub activity** to find meaningful coding moments
- **Generating professional posts** using AI (Groq LLM)
- **Publishing directly to LinkedIn** through official OAuth APIs

It's built for developers who want to grow their professional presence without spending hours crafting content.

**Currently supports LinkedIn** with GitLab, Bitbucket, Twitter/X, and Threads coming in future updates.

---

## What This App Does ✅

| Feature | Description |
|---------|-------------|
| **GitHub Activity Scanning** | Fetches your public commits, PRs, pushes, and new repos |
| **AI Post Generation** | Uses Groq LLM to create natural, engaging LinkedIn content |
| **OAuth-based LinkedIn Posting** | Publishes via LinkedIn's official API with your authorization |
| **Web Dashboard** | Modern UI with dark/light mode, stats, and post management |
| **Multi-User Support** | Per-user credentials with Clerk authentication |
| **Post Editor** | Manual writing with character counter and preview |
| **Image Integration** | Optional Unsplash images for visual posts |
| **CLI Bot Mode** | Standalone script for scheduled, automated posting |

## What This App Does NOT Do ❌

| Not Supported | Why |
|---------------|-----|
| Scraping LinkedIn | Violates Terms of Service |
| Automated credential harvesting | Security and compliance risk |
| Mass/spam posting | Against LinkedIn's policies |
| Engagement automation (likes, comments) | Not supported; would violate ToS |
| Bypassing rate limits | Posts are made through official APIs only |
| Storing LinkedIn passwords | OAuth tokens only; never raw credentials |

---

## Features vs. Limitations

### ✅ Current Features

- **Dashboard**: Real-time stats, post history, GitHub activity feed
- **Bot Mode Panel**: One-click workflow: Scan → Generate → Review → Publish
- **Activity Filters**: Filter by time range (1–30 days) and type (Push, PR, Commits, etc.)
- **Free Tier Limits**: Scanned activities capped at 10 to match daily post quota
- **Commit Count Badges**: Push events display commit counts (e.g., "3 commits")
- **Settings Management**: Individual save buttons per credential, masked secrets
- **Dark/Light Mode**: Full theme support across all pages
- **Keyboard Shortcuts**: Ctrl+Enter to publish, Escape to close modals
- **Post Templates**: Pre-built templates for common post types
- **Character Counter**: LinkedIn's 3000-character limit enforced

### ⚠️ Known Limitations

- **No scheduled queue** (yet) — posts are published immediately
- **Single image per post** — LinkedIn API limitation
- **No LinkedIn analytics** — engagement metrics not fetched from LinkedIn
- **English-only AI** — generated content is optimized for English
- **No mobile app** — web-only (responsive design available)

---

## 🆕 Recent Updates (December 2025)

### Clean Architecture Refactor

- **Modular Backend**: `app.py` refactored from 1832 → ~200 lines
- **SQLAlchemy Schema**: Type-safe table definitions in `backend/database/schema.py`
- **Alembic Migrations**: Professional schema versioning replaces `init_tables()`
- **Repository Pattern**: `BaseRepository` enforces user_id filtering for multi-tenant isolation
- **Dependency Injection**: `get_post_repository()` and `get_settings_repository()` helpers

### Security Hardening

- **JWT Authentication**: All 23+ API endpoints now require Clerk JWT verification
- **Multi-Tenant Isolation**: User ID ownership verified on every data endpoint (403 on mismatch)
- **Dev Mode Protection**: Development bypass now requires explicit `DEV_MODE=true` environment variable
- **Debug Logging**: Silent exception handlers now log errors for better troubleshooting

### Performance Optimizations

- **Stats Query Optimization**: Consolidated 5 sequential database queries into 1 query using conditional aggregation — dashboard stats now load in 1-2 seconds instead of 5-10+
- **Connection Pooling**: Database wrapper uses async connection pooling for PostgreSQL

### Frontend Improvements

- **Auth Token Integration**: Dashboard and Settings pages now properly authenticate all API requests
- **Type Safety**: Removed `any` types from error handling, replaced with proper TypeScript guards
- **Dead Code Removal**: Cleaned up deprecated `dashboard-old.tsx`

---

## 🆕 Recent Updates (January 2026)

### Persistent Bot Mode 🤖

- **Auto-Save Drafts**: Generated posts are immediately saved to the database as drafts, preventing data loss on refresh.
- **Historical Stats**: "Generated" and "Published" counts now reflect all-time history, not just the current session.
- **Smart Publishing**: Publishing updates existing drafts instead of creating duplicates.

### Enhanced Analytics 📊

- **Real-Time Accuracy**: Dashboard stats now accurately reflect live counts for Published, Draft, and Scheduled posts.
- **Growth Metrics**: Dynamic week-over-week growth percentages and "Published This Month" tracking.
- **Visual Improvements**: New "Scheduled" stats card and updated "Generated" vs "Published" cards.

### Post Scheduling 📅

- **Schedule for Later**: Ability to schedule posts for future publication dates.
- **Background Processing**: Powered by Celery and Redis for reliable timely delivery.
- **Management**: View and manage scheduled posts directly from the history view.

---

## Security & LinkedIn Compliance

This project prioritizes **safety and compliance**:

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | OAuth 2.0 via LinkedIn's official flow |
| **Token Storage** | Encrypted, per-user token store (never shared) |
| **API Compliance** | Uses only sanctioned LinkedIn APIs (`w_member_social`) |
| **No Automation Risk** | User initiates all actions; no background scraping |
| **Credential Masking** | API keys displayed as `gsk_xxxx...xxxx` |
| **CORS Protection** | Backend only accepts authorized frontend origins |
| **Clerk Integration** | JWT-verified requests for multi-tenant security |

> **Note**: This tool does NOT use browser automation, headless browsers, or any method that would violate LinkedIn's Terms of Service. All posting is done through LinkedIn's sanctioned Marketing/Share APIs.

---

## Credential & Security Model

This project implements a **secure multi-tenant architecture** with encryption at rest.

> ⚠️ **Security Guarantee**: Secrets NEVER reach the frontend. All API keys, tokens, and credentials are managed exclusively server-side.

### (A) App-Level Secrets (ENV-ONLY)

Platform secrets that **NEVER** enter the database. Loaded from environment variables only.

| Secret | Purpose | Notes |
|--------|---------|-------|
| `LINKEDIN_CLIENT_ID/SECRET` | OAuth app credentials | Operator-owned |
| `GROQ_API_KEY` | AI generation | Operator-owned |
| `GITHUB_TOKEN` | Higher API rate limits | Operator-owned |
| `UNSPLASH_ACCESS_KEY` | Image fetching | Operator-owned |
| `ENCRYPTION_KEY` | Token encryption key | 32-byte Fernet key |
| `CLERK_ISSUER` | JWT verification | Auth provider URL |

### (B) User-Level OAuth Tokens (Encrypted DB Storage)

Per-user tokens stored in `backend_tokens.db` with **Fernet encryption at rest**.

| Data | Encrypted | Notes |
|------|-----------|-------|
| `access_token` | ✅ Yes | LinkedIn OAuth token |
| `refresh_token` | ✅ Yes | Token refresh |
| `github_access_token` | ✅ Yes | Optional GitHub PAT |
| `linkedin_user_urn` | No | User's LinkedIn ID |
| `github_username` | No | Public identifier |
| `scopes` | No | OAuth scopes granted |

### (C) User Preferences (No Secrets)

User settings in `user_settings.db` contain **preferences only**, no secrets.

| Data | Type | Notes |
|------|------|-------|
| `github_username` | Text | Public identifier |
| `preferences` | JSON | UI/UX preferences |
| `onboarding_complete` | Boolean | Setup status |
| `subscription_tier` | Text | free/pro/enterprise |

---

### Multi-Tenant Isolation Model

Every user's data is strictly isolated using Clerk user IDs as tenant keys:

```
┌─────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION                          │
├─────────────────────────────────────────────────────────────┤
│  1. Every DB query filters by user_id (Clerk ID)            │
│  2. get_token_by_user_id() is the ONLY retrieval method     │
│  3. Tokens encrypted with shared ENCRYPTION_KEY             │
│  4. User A cannot access User B's tokens/settings           │
│  5. Parameterized queries prevent SQL injection             │
│  6. Frontend receives connection STATUS only, never tokens  │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Details:**

- `services/token_store.py`: All queries include `WHERE user_id=?`
- `services/user_settings.py`: Tenant-scoped preference storage
- No admin endpoints expose cross-tenant data

---

### Encryption at Rest Implementation

**Algorithm**: Fernet (AES-128-CBC + HMAC-SHA256)

```python
# services/encryption.py
from cryptography.fernet import Fernet

ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')  # 32-byte URL-safe base64
fernet = Fernet(ENCRYPTION_KEY.encode())

# Encrypt: plaintext → "ENC:base64_ciphertext"
# Decrypt: "ENC:base64_ciphertext" → plaintext
```

**Environment Behavior:**

| Environment | `ENCRYPTION_KEY` Present | Behavior |
|-------------|-------------------------|----------|
| Production (`ENV=production`) | ✅ Yes | Encrypt/decrypt normally |
| Production (`ENV=production`) | ❌ No | **Fail fast** with `EncryptionKeyMissingError` |
| Development | ✅ Yes | Encrypt/decrypt normally |
| Development | ❌ No | ⚠️ Warning logged, plaintext allowed |

**Generate a key:**

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

---

### Token Lifecycle

Complete flow from storage to internal use:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TOKEN LIFECYCLE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. STORE (OAuth callback)                                          │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ access_token = "abc123..."                                  │ │
│     │       ↓                                                     │ │
│     │ encrypt_value(access_token)                                 │ │
│     │       ↓                                                     │ │
│     │ "ENC:gAAAAABl..." (stored in SQLite)                        │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  2. RETRIEVE (API request)                                          │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ get_token_by_user_id(user_id)                               │ │
│     │       ↓                                                     │ │
│     │ "ENC:gAAAAABl..." (from SQLite)                             │ │
│     │       ↓                                                     │ │
│     │ decrypt_value(encrypted_token)                              │ │
│     │       ↓                                                     │ │
│     │ access_token = "abc123..." (in-memory only)                 │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  3. USE (Internal only)                                             │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ linkedin_service.post(access_token)  ← Server-side only    │ │
│     │ github_service.fetch(github_pat)     ← Server-side only    │ │
│     │                                                             │ │
│     │ ❌ NEVER returned to frontend                               │ │
│     │ ❌ NEVER logged in plaintext                                │ │
│     │ ❌ NEVER exposed in API responses                           │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  4. AUTO-MIGRATION (Legacy plaintext)                               │
│     ┌─────────────────────────────────────────────────────────────┐ │
│     │ If token doesn't start with "ENC:":                         │ │
│     │   1. Encrypt in memory                                      │ │
│     │   2. Atomic UPDATE with optimistic locking                  │ │
│     │   3. Set is_encrypted = 1                                   │ │
│     │   4. Return decrypted value for current request             │ │
│     └─────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### GitHub Integration & Privacy

The app connects to GitHub in two modes:

**1. Public Mode (Default)**

| Aspect | Details |
|--------|---------|
| **Requires** | Only `github_username` |
| **Endpoint** | `/users/{username}/events/public` |
| **Access** | Public activity only (pushes, PRs, new repos) |
| **Auth** | App-level `GITHUB_TOKEN` for rate limit boost |
| **Rate Limit** | 5000 req/hr (with token) or 60 req/hr (without) |
| **Privacy** | No access to private repositories |

**2. Authenticated Mode (Optional)**

| Aspect | Details |
|--------|---------|
| **Requires** | User-provided Personal Access Token (PAT) |
| **Endpoint** | `/users/{username}/events` |
| **Access** | Private AND public activity |
| **Auth** | User's PAT (encrypted in token_store) |
| **Rate Limit** | 5000 req/hr |
| **Privacy** | Access to private repos for post generation |

**Security Guarantees:**

- ✅ GitHub PAT is **encrypted at rest** in `backend_tokens.db`
- ✅ PAT is **never exposed** to frontend components
- ✅ PAT is used **only** for fetching activity to generate posts
- ✅ Rate limit errors (403) are handled gracefully with fallback

> **Note**: If no user PAT is provided, the app automatically uses Public Mode with the optional app-level `GITHUB_TOKEN` for rate limit boosts.

---

### Frontend Security Model

The frontend **NEVER** receives sensitive data:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND DATA FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ✅ ALLOWED (Safe Data)                                             │
│  ─────────────────────                                              │
│  • linkedin_connected: boolean                                      │
│  • github_connected: boolean                                        │
│  • github_username: "public-user"                                   │
│  • subscription_tier: "free" | "pro"                                │
│  • onboarding_complete: boolean                                     │
│                                                                      │
│  ❌ NEVER SENT (Secrets)                                            │
│  ─────────────────────                                              │
│  • access_token                                                     │
│  • refresh_token                                                    │
│  • github_access_token (PAT)                                        │
│  • groq_api_key                                                     │
│  • linkedin_client_secret                                           │
│  • unsplash_access_key                                              │
│  • Any masked versions (e.g., "gsk_xxxx...xxxx")                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**API Endpoints:**

| Endpoint | Returns |
|----------|---------|
| `GET /api/connection-status/{user_id}` | `{linkedin_connected, github_connected, github_username}` |
| `GET /api/settings/{user_id}` | `{github_username, onboarding_complete, subscription_tier}` |
| `POST /api/settings` | Accepts only: `user_id`, `github_username`, `onboarding_complete` |

**No credential input fields exist in:**

- ✅ Settings page
- ✅ Onboarding flow
- ✅ Dashboard
- ✅ Any frontend component

---

## Testing

Test files are located in the `tests/` directory:

```
tests/
├── test_github.py              # GitHub API integration tests
└── verify_phase2_security.py   # Security verification suite
```

### Run Security Verification

```bash
# Run all Phase 2 security checks
py tests/verify_phase2_security.py

# Expected output: 6/6 tests passed
```

### Security Tests Include

| Test | Description |
|------|-------------|
| `encryption_production` | Verifies fail-fast when `ENCRYPTION_KEY` missing in production |
| `encryption_development` | Verifies plaintext fallback with warning in development |
| `token_migration` | Checks atomic transactions with commit/rollback |
| `github_auth` | Validates deterministic endpoint selection based on token |
| `frontend_secrets` | Confirms no secrets in API request models |
| `readme_docs` | Verifies documentation matches implementation |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Backend** | Python 3.10+, FastAPI, Gunicorn + Uvicorn |
| **Database** | PostgreSQL (asyncpg) / SQLite (development) |
| **Authentication** | Clerk (frontend), JWT verification (backend) |
| **AI** | Groq LLM (llama3-70b-8192) |
| **APIs** | LinkedIn OAuth, GitHub REST API, Unsplash |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js @ :3000)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Pages     │  │  Components │  │    Hooks    │                  │
│  │  Dashboard  │  │  BotMode    │  │  useAuth    │                  │
│  │  Settings   │  │  PostEditor │  │  useTheme   │                  │
│  │  Onboarding │  │  Navbar     │  │             │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                         │                                            │
│                    Clerk Auth (JWT)                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                          REST API calls
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI @ :8000)                        │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      backend/app.py                          │    │
│  │  /api/github/scan    /api/posts    /api/publish/full        │    │
│  │  /api/settings       /api/templates                          │    │
│  │  /auth/linkedin/*    /api/contact                            │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                         │                                            │
│                    JWT Verification                                  │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICES LAYER                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │  ai_service    │  │ linkedin_svc   │  │ github_activity│         │
│  │  (Groq LLM)    │  │ (OAuth+Post)   │  │ (REST API)     │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ user_settings  │  │  token_store   │  │ image_service  │         │
│  │ (SQLite)       │  │  (SQLite)      │  │ (Unsplash)     │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  LinkedIn   │  │   GitHub    │  │    Groq     │  │  Unsplash  │  │
│  │  (OAuth)    │  │   (REST)    │  │   (LLM)     │  │  (Images)  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Frontend/Backend split** | Clear separation allows independent deployment (Vercel + Railway) |
| **Services layer** | Business logic isolated from API routes; reusable by CLI bot |
| **Per-user credentials** | Multi-tenant by design; users bring their own API keys |
| **PostgreSQL (prod)** | Async with asyncpg for high concurrency; SQLite fallback for dev |
| **Clerk for auth** | Handles JWT, sessions, and user management out of the box |
| **Gunicorn + Uvicorn** | Production-grade ASGI server with multiple workers |

### Multi-Tenant Service Pattern

All services in `services/` follow this pattern for multi-tenant support:

```python
# services/example_service.py

def service_function(
    required_params,
    user_token: str = None,      # User's credential (from token_store)
    user_key: str = None         # Per-user API key (from settings)
):
    # 1. Try user-provided credential
    credential = user_token or user_key
    
    # 2. Fall back to app-level env var (for CLI/single-user mode)
    if not credential:
        credential = os.getenv('APP_LEVEL_KEY')
    
    # 3. Fail gracefully if neither
    if not credential:
        logger.warning("No credential available")
        return None
```

**Service Summary:**

| Service | File | User Context Params |
|---------|------|---------------------|
| GitHub Activity | `github_activity.py` | `token` (PAT) |
| LinkedIn Posting | `linkedin_service.py` | `access_token`, `linkedin_user_urn` |
| AI Generation | `ai_service.py` | `groq_api_key` |
| Image Fetching | `image_service.py` | `unsplash_key` |

**Code Sharing:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CODE SHARING MODEL                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   CLI Bot (bot.py)          Web App (backend/app.py)                │
│         │                           │                               │
│         └─────────┬─────────────────┘                               │
│                   │                                                  │
│                   ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                 SHARED SERVICES (services/)                  │   │
│   │  github_activity • linkedin_service • ai_service • image    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                   │                                                  │
│   ┌───────────────┴───────────────┐                                 │
│   │                               │                                 │
│   ▼                               ▼                                 │
│  ENV vars                    token_store.py                         │
│  (CLI mode)                  (Web mode)                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

Get PostBot running in under 2 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/cliff-de-tech/linkedin-post-bot.git
cd linkedin-post-bot

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys (LinkedIn, Groq, etc.)

# 3. Start everything
make up
```

**That's it!** Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### Useful Commands

| Command | Description |
|---------|-------------|
| `make up` | Start the entire stack |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make worker-logs` | Debug Celery background tasks |
| `make shell` | Open shell in backend container |
| `make test` | Run backend tests |
| `make help` | Show all available commands |

---

## 🏗 Architecture

PostBot uses a modern microservices architecture for reliability and scalability:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           POSTBOT ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│   │   Next.js   │ ──API── │   FastAPI   │ ──SQL── │ PostgreSQL  │          │
│   │  Frontend   │         │   Backend   │         │  Database   │          │
│   │  (port 3000)│         │  (port 8000)│         │             │          │
│   └─────────────┘         └──────┬──────┘         └─────────────┘          │
│                                  │                                          │
│                           ┌──────┴──────┐                                   │
│                           │    Redis    │                                   │
│                           │   (broker)  │                                   │
│                           └──────┬──────┘                                   │
│                    ┌─────────────┼─────────────┐                            │
│                    │                           │                            │
│             ┌──────┴──────┐             ┌──────┴──────┐                     │
│             │   Celery    │             │   Celery    │                     │
│             │   Worker    │             │    Beat     │                     │
│             │ (tasks)     │             │ (scheduler) │                     │
│             └─────────────┘             └─────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Components

| Service | Technology | Purpose |
|---------|------------|---------|
| **Frontend** | Next.js 14 + React | User dashboard, post editor, settings |
| **Backend** | FastAPI + Python 3.10+ | REST API, OAuth flows, AI generation |
| **Worker** | Celery | Background tasks (publishing posts) |
| **Beat** | Celery Beat | Scheduled task runner (every 60s) |
| **Broker** | Redis | Message queue for task distribution |
| **Database** | PostgreSQL | User data, posts, tokens (encrypted) |

### Key Features

- **Distributed Task Queue**: Scheduled posts are processed by Celery workers, not blocking the API
- **Fault Tolerance**: Workers auto-retry failed posts with exponential backoff
- **Horizontal Scaling**: Add more workers to handle higher post volume
- **Health Checks**: All services report health status for monitoring

---

## Prerequisites

- **Docker & Docker Compose** (recommended) OR:
  - Node.js 18+
  - Python 3.10+
- Clerk account ([clerk.com](https://clerk.com))
- LinkedIn Developer App ([developers.linkedin.com](https://www.linkedin.com/developers))
- Groq API key ([console.groq.com](https://console.groq.com))

---

## Manual Installation (Without Docker)

If you prefer running without Docker:

```bash
# Clone repository
git clone https://github.com/cliff-de-tech/linkedin-post-bot.git
cd linkedin-post-bot

# Backend setup
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For running tests
cp .env.example .env  # Configure your API keys

# Frontend setup
cd web
npm install
cp .env.local.example .env.local  # Configure Clerk keys & Redirect URI
```

### Running Locally (Development)

```bash
# Terminal 1: Start backend API
cd linkedin-post-bot
python -m uvicorn backend.app:app --reload --port 8000

# Terminal 2: Start frontend
cd linkedin-post-bot/web
npm run dev

# Terminal 3 (Optional): Start Celery worker for background tasks
celery -A services.celery_app worker --loglevel=info

# Terminal 4 (Optional): Start Celery beat for scheduled posts
celery -A services.celery_app beat --loglevel=info
```

> **Note**: For local development without Redis, scheduled posts will not auto-publish.
> The full Docker stack (`make up`) is recommended for testing scheduled functionality.

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### User Onboarding Flow

New users go through a simple 4-step setup:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONBOARDING FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Welcome                                                │
│  ─────────────────                                              │
│  Brief intro to PostBot, ~2 minute setup                        │
│                                                                  │
│  Step 2: GitHub Username                                        │
│  ─────────────────────────                                      │
│  Enter public GitHub username (e.g., "cliff-de-tech")           │
│  Used to fetch public activity for post content                 │
│                                                                  │
│  [Optional] Connect GitHub OAuth                                │
│  ──────────────────────────────                                 │
│  For private repository access                                  │
│  Grants read-only access to your repos                          │
│                                                                  │
│  Step 3: Connect LinkedIn                                       │
│  ────────────────────────                                       │
│  One-click OAuth connection                                     │
│  User is redirected to LinkedIn, then back                      │
│  Token stored encrypted in backend                              │
│                                                                  │
│  Step 4: All Done                                               │
│  ─────────────────                                              │
│  Summary confirmation, redirect to dashboard                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What's NOT collected:**

- ❌ LinkedIn API secrets (server-managed)
- ❌ Groq API keys (server-managed)
- ❌ Unsplash keys (server-managed)
- ❌ Any technical credentials

### Settings Page

The settings page (`/settings`) shows connection status only—no credential input:

**Features:**

- ✅ LinkedIn connection status (Connected / Not Connected)
- ✅ GitHub username display and edit
- ✅ GitHub OAuth status (for private repos)
- ✅ "Reconnect" / "Disconnect" for LinkedIn
- ✅ "Connect" / "Disconnect" for GitHub OAuth
- ✅ Token expiry date display

**Not Displayed:**

- ❌ Access tokens
- ❌ Refresh tokens
- ❌ API keys
- ❌ Any sensitive credentials

**Backend Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/connection-status/{user_id}` | GET | Returns boolean connection states only |
| `/api/disconnect-linkedin` | POST | Deletes stored LinkedIn OAuth token |
| `/api/disconnect-github` | POST | Deletes stored GitHub OAuth token |

### Data Isolation & Accuracy Guarantees

PostBot ensures each user's data is **strictly isolated** and posts are generated from **their own activity only**.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ISOLATION                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User A                                User B                        │
│    │                                     │                          │
│    ▼                                     ▼                          │
│  ┌─────────────┐                    ┌─────────────┐                 │
│  │ GitHub A    │                    │ GitHub B    │                 │
│  │ username +  │                    │ username +  │                 │
│  │ token       │                    │ token       │                 │
│  └──────┬──────┘                    └──────┬──────┘                 │
│         │                                  │                        │
│         ▼                                  ▼                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 SHARED INFRASTRUCTURE                        │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │ AI Service (App-level Groq key)                         ││   │
│  │  │ Receives: User-specific activity data ONLY              ││   │
│  │  │ Never sees: Other users' data                           ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │ Image Service (App-level Unsplash key)                  ││   │
│  │  │ Driven by: Post content context                         ││   │
│  │  │ No user secrets: Query based on post text only          ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
│         │                                  │                        │
│         ▼                                  ▼                        │
│  ┌─────────────┐                    ┌─────────────┐                 │
│  │ LinkedIn A  │                    │ LinkedIn B  │                 │
│  │ OAuth token │                    │ OAuth token │                 │
│  └─────────────┘                    └─────────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**GitHub Activity:**

| Scope | How It's Enforced |
|-------|-------------------|
| Username | Passed per-request, never shared |
| Token (if OAuth) | Retrieved from `token_store` by `user_id` |
| API Calls | Scoped to that user's repos/events only |

**AI Generation:**

| Aspect | Implementation |
|--------|----------------|
| API Key | App-level `GROQ_API_KEY` (or user-provided) |
| Input Data | User-specific activity data only |
| Context | Never sees other users' activities |

**Unsplash Images:**

| Aspect | Implementation |
|--------|----------------|
| API Key | App-level `UNSPLASH_ACCESS_KEY` |
| Query | Derived from post content keywords |
| User Secrets | Not used – purely content-driven |

**Why This Matters:**

1. ✅ **No cross-user data leakage** – Each API call includes only that user's identifiers
2. ✅ **Posts are authentic** – Generated from real user activity, not synthetic data
3. ✅ **Shared services are stateless** – AI and image services don't retain user context

The FastAPI backend provides OpenAPI documentation at stable URLs:

| Endpoint | Description |
|----------|-------------|
| `/openapi.json` | OpenAPI 3.0 specification (JSON) |
| `/docs` | Interactive Swagger UI documentation |
| `/redoc` | ReDoc alternative documentation |

**Local development:**

- OpenAPI spec: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

**Production:** The same endpoints are available at your deployed backend URL.

```bash
# Download OpenAPI spec for code generation
curl http://localhost:8000/openapi.json > openapi.json

# Or in production
curl https://your-backend.railway.app/openapi.json > openapi.json
```

---

## Project Structure

```
linkedin-post-bot/
├── web/                        # Next.js Frontend
│   ├── src/pages/              # Dashboard, Settings, Onboarding
│   ├── src/components/         # UI Components
│   └── src/hooks/              # Custom React hooks
├── backend/                    # FastAPI Backend (Clean Architecture)
│   ├── app.py                  # Slim entry point (~200 lines)
│   ├── core/                   # Configuration & logging
│   │   └── config.py           # Environment, CORS, templates
│   ├── database/               # SQLAlchemy schema
│   │   └── schema.py           # Table definitions
│   ├── migrations/             # Alembic migrations
│   │   ├── env.py              # Async migration env
│   │   └── versions/           # Migration files
│   ├── repositories/           # Data access layer
│   │   ├── base.py             # BaseRepository (user_id filtering)
│   │   ├── posts.py            # PostRepository
│   │   └── settings.py         # SettingsRepository
│   ├── routes/                 # API routers
│   │   ├── github.py           # GitHub OAuth + scan
│   │   ├── linkedin.py         # LinkedIn OAuth
│   │   └── posts.py            # Post generation
│   ├── schemas/                # Pydantic models
│   │   └── requests.py         # Request/response models
│   ├── middleware/             # Auth middleware
│   └── dependencies.py         # DI helpers
├── services/                   # Core Business Logic
│   ├── ai_service.py           # Groq AI integration
│   ├── github_activity.py      # GitHub API client
│   ├── linkedin_service.py     # LinkedIn posting
│   ├── db.py                   # Database connection
│   └── user_settings.py        # Settings storage
├── bot.py                      # Standalone CLI bot
└── auth.py                     # OAuth helper
```

---

## CLI vs Web Usage Differences

PostBot supports **two modes of operation**:

### Web Application Mode

The web app (`web/` + `backend/`) is designed for multi-user SaaS deployment:

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | Clerk (JWT-based) |
| **Credentials** | Per-user encrypted token storage |
| **LinkedIn OAuth** | User authorizes via web flow |
| **GitHub Access** | Username (public) + optional OAuth (private) |
| **API Keys** | App-level only (env vars) |
| **Multi-User** | ✅ Full tenant isolation |

**Configuration:**

```bash
# Backend .env
LINKEDIN_CLIENT_ID=...      # Your LinkedIn app
LINKEDIN_CLIENT_SECRET=...
GROQ_API_KEY=...           # Shared AI key
UNSPLASH_ACCESS_KEY=...    # Shared image key
ENCRYPTION_KEY=...         # Token encryption

# Frontend .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

### CLI Bot Mode

The standalone `bot.py` is designed for personal/scheduled use:

| Aspect | Implementation |
|--------|----------------|
| **Authentication** | Environment variables only |
| **Credentials** | Single user, loaded from `.env` |
| **LinkedIn OAuth** | Pre-configured token (manual setup) |
| **GitHub Access** | Token from env var |
| **API Keys** | Personal keys in `.env` |
| **Multi-User** | ❌ Single user only |

**Configuration:**

```bash
# .env for CLI mode
LINKEDIN_ACCESS_TOKEN=...   # Your personal token
LINKEDIN_USER_URN=...       # Your LinkedIn URN
MY_GITHUB_USERNAME=...
GITHUB_TOKEN=...           # Optional: higher rate limits
GROQ_API_KEY=...
UNSPLASH_ACCESS_KEY=...
```

### When to Use Each

| Use Case | Recommended Mode |
|----------|------------------|
| Personal automated posting | CLI (`bot.py`) |
| Scheduled cron jobs | CLI (`bot.py`) |
| Multi-user platform | Web App |
| Team/agency use | Web App |
| Quick one-off posts | Either |

### Shared Service Layer

Both modes use the same `services/` modules:

```
CLI (bot.py)                Web (backend/app.py)
     │                              │
     └──────────────────────────────┘
                     │
                     ▼
     ┌───────────────────────────────┐
     │  services/                    │
     │  - github_activity.py         │
     │  - ai_service.py              │
     │  - linkedin_service.py        │
     │  - image_service.py           │
     └───────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
   ENV vars (CLI)          token_store (Web)
```

---

## Roadmap

### 🎯 Short Term (Next 2–4 weeks)

- [ ] Scheduled posting queue (time-delayed publishing)
- [ ] Post drafts with save/restore
- [ ] Export post history to CSV

### 🚀 Mid Term (1–3 months)

- [ ] Multi-account support (multiple LinkedIn profiles)
- [ ] AI persona customization (tone, style, hashtags)
- [ ] Docker deployment package
- [ ] Basic engagement analytics (post performance)

### 🌟 Long Term (3–6 months)

- [ ] Mobile companion app (React Native)
- [ ] Team/agency mode (manage multiple clients)
- [ ] Content calendar view
- [ ] LinkedIn analytics integration (if API permits)

---

## 🌐 Live Demo

> **Demo Coming Soon** — check back for a live preview of the dashboard.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/cliff-de-tech/linkedin-post-bot&project-name=linkedin-post-bot&root-directory=web)

---

## Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com) and import your GitHub repo
   - Set root directory to `web`

2. **Configure Environment Variables**

   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
   CLERK_SECRET_KEY=sk_live_xxx
   NEXT_PUBLIC_REDIRECT_URI=https://your-frontend.vercel.app/auth/callback
   ```

3. **Deploy**
   - Vercel will auto-build with `npm run build`
   - Production URL: `https://your-app.vercel.app`

### Backend Deployment (Render)

1. **Create New Web Service**
   - Go to [render.com](https://render.com) and create a new Web Service
   - Connect your GitHub repo

2. **Configure Build**

   ```yaml
   Root Directory: backend
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app --bind 0.0.0.0:$PORT
   ```

3. **Environment Variables**

   ```
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   GROQ_API_KEY=gsk_your_groq_key
   ENCRYPTION_KEY=your_fernet_encryption_key
   CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
   ```

4. **Deploy**
   - Render auto-deploys on push to main
   - Backend URL: `https://your-app.onrender.com`

### Alternative: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd backend && railway up
cd ../web && railway up
```

### Docker Deployment

The backend includes a production-ready Dockerfile:

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Production: Gunicorn with Uvicorn workers (4 workers)
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app:app", "--bind", "0.0.0.0:8000"]
```

**Build and run:**

```bash
cd backend
docker build -t linkedin-post-bot-api .
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e GROQ_API_KEY=gsk_... \
  -e ENCRYPTION_KEY=... \
  linkedin-post-bot-api
```

---

## Development

```bash
# Run backend with hot-reload (from project root)
python -m uvicorn backend.app:app --reload --port 8000

# Run frontend
cd web && npm run dev

# Database migrations (from backend directory)
cd backend && alembic upgrade head              # Apply migrations
cd backend && alembic revision --autogenerate -m "description"  # New migration
cd backend && alembic downgrade -1              # Rollback one

# Run tests
cd backend && pytest tests/ -v
cd web && npm test

# Lint & type check
cd web && npm run lint && npm run build
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No GitHub activity found" | Verify `GITHUB_USERNAME`, extend day range |
| LinkedIn auth fails | Check Client ID/Secret and redirect URL |
| AI posts are empty | Verify `GROQ_API_KEY` is valid |
| "Invalid token" | Re-authenticate with LinkedIn |
| Credentials not saving | Restart backend, check console logs |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — free for personal and commercial use.

---

**Built by [cliff-de-tech](https://github.com/cliff-de-tech)** | Happy posting! 🚀
