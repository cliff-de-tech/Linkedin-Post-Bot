# PostBot - AI LinkedIn Post Generator

A modern, production-ready web application for generating high-quality LinkedIn posts from GitHub activity using AI.

## 🚀 Features

- **AI-Powered Generation**: Create engaging posts from your code commits using Groq, OpenAI (Pro), or Anthropic (Pro).
- **GitHub Integration**: Automatically scan and visualize your recent coding activity.
- **Smart Dashboard**:
  - **Activity Feed**: View and select commits to post about.
  - **Stats Overview**: Track your generation and publishing metrics.
  - **Post Queue**: Manage, edit, and schedule drafted posts.
- **Premium UX**:
  - **Skeleton Loading**: Smooth loading states for all data-heavy components.
  - **Dark Mode**: Fully supported system-aware dark theme.
  - **Responsive Design**: Optimized for mobile and desktop.
- **Secure Authentication**: Power by Clerk for robust user management.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS, Class Variance Authority (CVA)
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Clerk
- **Icons**: Heroicons
- **HTTP Client**: Axios

## 📦 Project Structure

```
web/
├── src/
│   ├── components/
│   │   ├── dashboard/    # Dashboard-specific widgets (Stats, Feed, Queue)
│   │   ├── layout/       # Layout wrappers (Sidebar, Header)
│   │   ├── ui/           # Reusable UI primitives (Button, Card, Skeleton)
│   │   └── modals/       # Dialog components
│   ├── hooks/            # Custom React hooks (useDashboardData)
│   ├── lib/              # Utilities (API client, formatting)
│   ├── pages/            # Next.js routes
│   └── styles/           # Global styles and Tailwind directives
├── public/               # Static assets
└── ...config files
```

## ⚡ Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**
   Create `.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Verify Code Quality**

   ```bash
   npm run lint
   ```

## 🔒 Security

- secrets are never exposed in the client.
- API requests are authenticated via secure tokens.
- Sensitive actions (API keys management) are server-side only.

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
