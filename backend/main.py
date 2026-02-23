from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List
import uvicorn

from database import get_db, engine
import models
import schemas
import auth

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartExpense API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    email = auth.verify_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.Token)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(
        email=payload.email,
        name=payload.name,
        hashed_password=auth.hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = auth.create_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ── Expenses ──────────────────────────────────────────────────────────────────

@app.get("/expenses", response_model=List[schemas.ExpenseOut])
def list_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    q = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)
    if category:
        q = q.filter(models.Expense.category == category)
    if search:
        q = q.filter(models.Expense.note.ilike(f"%{search}%"))
    if month and year:
        q = q.filter(
            models.Expense.date >= datetime(year, month, 1),
            models.Expense.date < datetime(year, month + 1, 1) if month < 12 else datetime(year + 1, 1, 1),
        )
    return q.order_by(models.Expense.date.desc()).all()


@app.post("/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = models.Expense(**payload.dict(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    payload: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    for k, v in payload.dict().items():
        setattr(expense, k, v)
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()


# ── Budget ────────────────────────────────────────────────────────────────────

@app.get("/budget", response_model=schemas.BudgetOut)
def get_budget(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    if not budget:
        budget = models.Budget(user_id=current_user.id, monthly_limit=2000.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget


@app.put("/budget", response_model=schemas.BudgetOut)
def update_budget(
    payload: schemas.BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    budget = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    if not budget:
        budget = models.Budget(user_id=current_user.id, monthly_limit=payload.monthly_limit)
        db.add(budget)
    else:
        budget.monthly_limit = payload.monthly_limit
    db.commit()
    db.refresh(budget)
    return budget


# ── Analytics ─────────────────────────────────────────────────────────────────

@app.get("/analytics/summary")
def analytics_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    now = datetime.now()
    m = month or now.month
    y = year or now.year
    start = datetime(y, m, 1)
    end = datetime(y, m + 1, 1) if m < 12 else datetime(y + 1, 1, 1)

    expenses = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= start,
        models.Expense.date < end,
    ).all()

    total = sum(e.amount for e in expenses)
    by_category = {}
    for e in expenses:
        by_category[e.category] = by_category.get(e.category, 0) + e.amount

    budget = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    monthly_limit = budget.monthly_limit if budget else 2000.0

    return {
        "total": total,
        "monthly_limit": monthly_limit,
        "by_category": by_category,
        "expense_count": len(expenses),
        "month": m,
        "year": y,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
