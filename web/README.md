# LinkedIn Post Bot - Web UI

Next.js frontend for the LinkedIn Post Bot application.

## Quick Start

1. Install dependencies:
```bash
cd web
npm install
```

2. Configure environment:
```bash
# Create .env.local with:
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/auth/callback
```

3. Run development server:
```bash
npm run dev
```

Visit http://localhost:3000

## Features

- **Home Page** - Landing page with features overview
- **Dashboard** - Post generator with context editor and preview
- **LinkedIn OAuth** - Connect your LinkedIn account
- **Real-time Preview** - See generated posts before publishing
- **Test Mode** - Preview without posting to LinkedIn

## Pages

- `/` - Home/landing page
- `/dashboard` - Post generator dashboard
- `/auth/callback` - LinkedIn OAuth callback handler

## API Integration

The web app connects to the FastAPI backend running on port 8000. Configure the API URL in `.env.local`.

## Deployment

Build for production:
```bash
npm run build
npm start
```

Deploy to Vercel (recommended):
```bash
vercel deploy
```
