# Contributing to LinkedIn Post Bot

Thank you for your interest in contributing! This guide will help you get set up and understand our development workflow.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | For Next.js frontend |
| Python | 3.10+ | For FastAPI backend |
| npm | 9+ | Package manager |
| Git | 2.30+ | Version control |

### Clone the Repository

```bash
git clone https://github.com/cliff-de-tech/linkedin-post-bot.git
cd linkedin-post-bot
```

---

## Development Setup

### 1. Backend Setup

```bash
# Create virtual environment (recommended)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### 2. Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Clerk keys
```

### 3. Running the Application

**Terminal 1 — Backend:**
```bash
cd backend
python app.py
# Or with hot-reload:
uvicorn app:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd web
npm run dev
```

**Access the app:** Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
linkedin-post-bot/
├── web/                    # Next.js 14 Frontend
│   ├── src/pages/          # Page routes
│   ├── src/components/     # React components
│   ├── src/hooks/          # Custom hooks
│   └── src/lib/            # Utilities
├── backend/                # FastAPI Backend
│   ├── app.py              # API entry point
│   └── middleware/         # Auth middleware
├── services/               # Business Logic Layer
│   ├── ai_service.py       # Groq AI integration
│   ├── github_activity.py  # GitHub API
│   ├── linkedin_service.py # LinkedIn posting
│   └── ...
├── bot.py                  # Standalone CLI bot
└── docs/                   # Additional documentation
```

### Key Files

| File | Purpose |
|------|---------|
| `backend/app.py` | FastAPI server, all API routes |
| `services/ai_service.py` | AI post generation with Groq |
| `services/linkedin_service.py` | LinkedIn OAuth and posting |
| `web/src/pages/_app.tsx` | Next.js app wrapper with Clerk |
| `web/src/pages/dashboard.tsx` | Main dashboard page |

---

## Code Standards

### TypeScript/JavaScript (Frontend)

- **Formatter:** Prettier (default settings)
- **Linter:** ESLint (Next.js config)
- **Naming:** camelCase for variables, PascalCase for components
- **Imports:** Group by external → internal → relative

```bash
# Run linter
cd web && npm run lint

# Type check
cd web && npm run build
```

### Python (Backend)

- **Formatter:** Black (line length 88)
- **Linter:** Flake8
- **Naming:** snake_case for functions/variables, PascalCase for classes
- **Type hints:** Required for function parameters

```bash
# Format code
black backend/ services/

# Lint
flake8 backend/ services/
```

### CSS

- **Framework:** Tailwind CSS 3.3
- **Custom styles:** Use CSS variables for theming
- **Responsive:** Mobile-first approach

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no new feature or fix |
| `test` | Adding tests |
| `chore` | Build, tooling, deps |

### Examples

```bash
feat(dashboard): add post queue panel
fix(auth): handle expired LinkedIn tokens
docs(readme): update installation steps
refactor(services): extract token validation
```

---

## Pull Request Process

### Before Submitting

1. **Branch from `main`:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run checks:**
   ```bash
   # Frontend
   cd web && npm run lint && npm run build
   
   # Backend (if applicable)
   black --check backend/ services/
   ```

3. **Test your changes:**
   - Start both servers
   - Verify existing features still work
   - Test your new feature

### PR Requirements

- [ ] Clear title following commit conventions
- [ ] Description of what changed and why
- [ ] Screenshots for UI changes
- [ ] No breaking changes (unless discussed)
- [ ] Lint and build pass

### Review Process

1. Submit PR → Automatic checks run
2. Maintainer reviews code
3. Address feedback if any
4. Merge when approved

---

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones

---

**Thank you for contributing!** 🚀
