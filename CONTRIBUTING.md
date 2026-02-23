# Contributing to SmartExpense

Thanks for your interest in contributing! This guide will get you set up quickly.

---

## Getting Started

### 1. Fork & clone

```bash
git clone https://github.com/YOUR_USERNAME/smartexpense.git
cd smartexpense
```

### 2. Set up the dev environment

```bash
# Easiest: spin up everything with Docker
docker-compose up --build

# Or manually — see README.md for step-by-step instructions
```

### 3. Create a branch

Use a descriptive branch name with a prefix:

| Prefix | When to use |
|--------|-------------|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `refactor/` | Code change with no behavior change |
| `chore/` | Tooling, config, dependencies |

```bash
git checkout -b feat/csv-export
```

---

## Development Workflow

### Backend (FastAPI)

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/ -v

# Lint
ruff check .
```

### Frontend (Next.js)

```bash
cd frontend
npm run dev       # dev server on :3000
npm run lint      # ESLint check
npm run build     # production build check
```

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CSV export for expenses
fix: correct budget calculation when month rolls over
docs: update deployment instructions for Render
refactor: extract category utils into shared module
```

---

## Submitting a PR

1. Make sure `npm run lint` and `pytest` pass locally
2. Fill out the PR template fully
3. Link the related issue (`Fixes #42`)
4. Request a review

PRs that don't pass CI checks will not be merged.

---

## Code Style

**Python (backend)**
- Formatter: `ruff format` (Black-compatible)
- Linter: `ruff check`
- Type hints are encouraged

**JavaScript (frontend)**
- ESLint with Next.js defaults
- Prefer named exports for components
- Keep components small — extract logic into hooks

---

## Project Structure Quick Reference

```
backend/
  main.py       # All route handlers
  models.py     # Add new DB tables here
  schemas.py    # Add new Pydantic models here
  auth.py       # Auth utilities (don't modify lightly)

frontend/
  pages/        # One file per route
  components/   # Shared UI components
  hooks/        # Custom React hooks
  lib/api.js    # Add new API calls here
```

---

## Questions?

Open a [Discussion](../../discussions) or file an issue. We're happy to help.
