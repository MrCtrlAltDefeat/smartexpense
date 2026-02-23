# 🧾 SmartExpense

<p align="center">
  <strong>Personal finance tracker built with Next.js, FastAPI, and PostgreSQL.</strong><br/>
  Log expenses, set monthly budgets, and visualize spending — all in one dark-themed dashboard.
</p>

<p align="center">
  <img alt="Backend CI" src="https://github.com/YOUR_USERNAME/smartexpense/actions/workflows/backend.yml/badge.svg" />
  <img alt="Frontend CI" src="https://github.com/YOUR_USERNAME/smartexpense/actions/workflows/frontend.yml/badge.svg" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green" />
  <img alt="Python" src="https://img.shields.io/badge/python-3.11-blue" />
  <img alt="Next.js" src="https://img.shields.io/badge/next.js-14-black" />
</p>

---

## ✨ Features

- **JWT authentication** — register, login, persistent sessions
- **Expense CRUD** — add, edit, delete with category, amount, date, and note
- **Dashboard** — monthly totals, pie + bar charts, budget progress bar
- **Expense table** — filter by category, search by note
- **Budget manager** — set monthly limit, see daily remaining, overage alerts
- **Full test suite** — pytest covering all API endpoints
- **CI/CD** — GitHub Actions for lint + test on every push, auto-deploy on merge to `main`

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Recharts |
| Backend | FastAPI (Python 3.11) |
| Database | PostgreSQL 15 |
| Auth | JWT via `python-jose` + `bcrypt` |
| Deployment | Vercel (frontend) + Render (backend) |
| CI/CD | GitHub Actions |

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/smartexpense.git
cd smartexpense
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Interactive API docs | http://localhost:8000/docs |

### Option B — Manual Setup

**Prerequisites:** Python 3.11+, Node.js 20+, PostgreSQL 15+

**1. Database**

```bash
createdb smartexpense
```

**2. Backend**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY

uvicorn main:app --reload --port 8000
```

**3. Frontend**

```bash
cd frontend
npm install

cp .env.local.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Open http://localhost:3000 and register an account.

---

## 📁 Project Structure

```
smartexpense/
├── .github/
│   ├── workflows/
│   │   ├── backend.yml       # Test + lint on push
│   │   ├── frontend.yml      # Build + lint on push
│   │   └── deploy.yml        # Auto-deploy on merge to main
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── backend/
│   ├── main.py               # All route handlers
│   ├── models.py             # SQLAlchemy: User, Expense, Budget
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT + bcrypt helpers
│   ├── database.py           # DB engine + session factory
│   ├── tests/
│   │   └── test_api.py       # Full API test suite (pytest)
│   ├── requirements.txt
│   ├── pyproject.toml        # ruff linting config
│   └── Dockerfile
│
├── frontend/
│   ├── pages/
│   │   ├── index.js          # Landing page
│   │   ├── login.js          # Sign in
│   │   ├── register.js       # Sign up
│   │   ├── dashboard.js      # Analytics + charts
│   │   ├── expenses.js       # Expense table + CRUD
│   │   └── budget.js         # Budget settings
│   ├── components/
│   │   ├── Layout.js         # Sidebar navigation
│   │   └── ExpenseModal.js   # Add/edit expense form
│   ├── hooks/
│   │   └── useAuth.js        # Auth context + helpers
│   ├── lib/
│   │   └── api.js            # Axios client + all API calls
│   ├── styles/
│   │   └── globals.css       # Design system (CSS variables)
│   └── Dockerfile
│
├── docker-compose.yml
├── .gitignore
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## 🔌 API Reference

All endpoints except `/auth/*` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Login, receive JWT |
| `GET` | `/auth/me` | Get current user |

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/expenses` | List (supports `?category=`, `?search=`, `?month=`, `?year=`) |
| `POST` | `/expenses` | Create expense |
| `PUT` | `/expenses/{id}` | Update expense |
| `DELETE` | `/expenses/{id}` | Delete expense |

**Example request body:**
```json
{
  "amount": 24.50,
  "category": "Food & Drink",
  "note": "Lunch at the café",
  "date": "2024-01-15T12:30:00"
}
```

### Budget

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/budget` | Get monthly budget (creates default $2,000 if none) |
| `PUT` | `/budget` | Update monthly limit |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/summary` | Total, by-category breakdown, expense count for a month |

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## ⚙️ Environment Variables

### Backend — `backend/.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartexpense
SECRET_KEY=your-long-random-secret-key-here
```

### Frontend — `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🌐 Deployment

### Backend → Render

1. Create a **PostgreSQL** database on [Render](https://render.com)
2. Create a **Web Service**, connect your repo, set root to `backend/`
3. Configure:
   - **Build:** `pip install -r requirements.txt`
   - **Start:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add env vars: `DATABASE_URL` (from Render DB) and `SECRET_KEY`

### Frontend → Vercel

1. Import the repo on [Vercel](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add env var: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`
4. Deploy

### CI/CD Secrets (for auto-deploy workflow)

| Secret | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK` | Render → Service → Deploy Hook URL |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel project settings |
| `VERCEL_PROJECT_ID` | Vercel project settings |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, branch conventions, commit message format, and PR guidelines.

---

## 📄 License

[MIT](LICENSE) — free to use, modify, and distribute.
