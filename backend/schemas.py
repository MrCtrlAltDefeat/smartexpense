from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ── Expense ───────────────────────────────────────────────────────────────────

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    note: Optional[str] = ""
    date: datetime


class ExpenseOut(ExpenseCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Budget ────────────────────────────────────────────────────────────────────

class BudgetUpdate(BaseModel):
    monthly_limit: float


class BudgetOut(BudgetUpdate):
    id: int
    user_id: int

    class Config:
        from_attributes = True
