# LinkedIn Post Bot

> **Transform your GitHub activity into professional LinkedIn content — powered by AI, designed for developers who code more than they post.**

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

### Security Tests Include:
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
| **Backend** | Python 3.10+, FastAPI, SQLite |
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
| **SQLite storage** | Simple, file-based; no external database dependency |
| **Clerk for auth** | Handles JWT, sessions, and user management out of the box |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Clerk account ([clerk.com](https://clerk.com))
- LinkedIn Developer App ([developers.linkedin.com](https://www.linkedin.com/developers))
- Groq API key ([console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone repository
git clone https://github.com/cliff-de-tech/linkedin-post-bot.git
cd linkedin-post-bot

# Backend setup
pip install -r requirements.txt
cp .env.example .env  # Configure your API keys

# Frontend setup
cd web
npm install
cp .env.local.example .env.local  # Configure Clerk keys
```

### Running Locally

```bash
# Terminal 1: Start backend
cd backend && python app.py

# Terminal 2: Start frontend
cd web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

### API Documentation

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
├── web/                    # Next.js Frontend
│   ├── src/pages/          # Dashboard, Settings, Onboarding
│   ├── src/components/     # UI Components
│   └── src/hooks/          # Custom React hooks
├── backend/                # FastAPI Backend
│   ├── app.py              # API server
│   └── middleware/         # Auth middleware
├── services/               # Core Business Logic
│   ├── ai_service.py       # Groq AI integration
│   ├── github_activity.py  # GitHub API client
│   ├── linkedin_service.py # LinkedIn posting
│   └── user_settings.py    # Settings storage
├── bot.py                  # Standalone CLI bot
└── auth.py                 # OAuth helper
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
   Start Command: uvicorn app:app --host 0.0.0.0 --port $PORT
   ```

3. **Environment Variables**
   ```
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   GROQ_API_KEY=gsk_your_groq_key
   GITHUB_USERNAME=your_github_username
   CLERK_ISSUER=https://your-clerk-instance.clerk.accounts.dev
   TOKEN_DB_PATH=/opt/render/project/src/backend_tokens.db
   USER_SETTINGS_DB_PATH=/opt/render/project/src/user_settings.db
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

### Docker Deployment (Coming Soon)

```dockerfile
# Dockerfile for backend (backend/Dockerfile)
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Development

```bash
# Run with hot-reload
cd backend && uvicorn app:app --reload --port 8000
cd web && npm run dev

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
