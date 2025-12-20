# Backend (FastAPI) for LinkedIn Post Bot

Quick start (local):

1. Create a virtualenv and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # on Windows use: .venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. Copy environment variables from `.env.example` and set them locally.

3. Run the API

```bash
python backend/app.py
# or
uvicorn backend.app:app --reload --port 8000
```

Endpoints:
- `GET /health` - health check
- `POST /generate-preview` - body: `{ "context": { ... } }` -> returns generated post preview
- `POST /publish` - body: `{ "context": { ... }, "test_mode": true }` -> preview or publish

Notes:
- This minimal backend imports and reuses functions in the project `bot.py`. Keep `bot.py` in the project root.
- Implement proper auth, token storage, and background workers in subsequent iterations.
