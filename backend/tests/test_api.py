"""
Backend test suite for SmartExpense API.

Run with:
    pytest tests/ -v

Requires DATABASE_URL and SECRET_KEY env vars (set in CI, or create a .env.test locally).
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

os.environ.setdefault("DATABASE_URL", "postgresql://postgres:password@localhost:5432/smartexpense_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from main import app
from database import Base, get_db

TEST_DB_URL = os.environ["DATABASE_URL"]

engine = create_engine(TEST_DB_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Helpers ───────────────────────────────────────────────────────────────────

def register_and_login(client, email="test@example.com", password="password123"):
    client.post("/auth/register", json={"name": "Test User", "email": email, "password": password})
    resp = client.post("/auth/login", json={"email": email, "password": password})
    return resp.json()["access_token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ── Auth tests ────────────────────────────────────────────────────────────────

class TestAuth:
    def test_register_success(self, client):
        resp = client.post("/auth/register", json={
            "name": "Alice", "email": "alice@example.com", "password": "securepass"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "alice@example.com"

    def test_register_duplicate_email(self, client):
        payload = {"name": "Bob", "email": "bob@example.com", "password": "securepass"}
        client.post("/auth/register", json=payload)
        resp = client.post("/auth/register", json=payload)
        assert resp.status_code == 400

    def test_login_success(self, client):
        client.post("/auth/register", json={"name": "Carol", "email": "carol@example.com", "password": "pass1234"})
        resp = client.post("/auth/login", json={"email": "carol@example.com", "password": "pass1234"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_wrong_password(self, client):
        client.post("/auth/register", json={"name": "Dave", "email": "dave@example.com", "password": "rightpass"})
        resp = client.post("/auth/login", json={"email": "dave@example.com", "password": "wrongpass"})
        assert resp.status_code == 401

    def test_me_requires_auth(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 403

    def test_me_returns_user(self, client):
        token = register_and_login(client, "eve@example.com")
        resp = client.get("/auth/me", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["email"] == "eve@example.com"


# ── Expense tests ─────────────────────────────────────────────────────────────

class TestExpenses:
    def test_create_expense(self, client):
        token = register_and_login(client, "frank@example.com")
        resp = client.post("/expenses", json={
            "amount": 25.50,
            "category": "Food & Drink",
            "note": "Lunch",
            "date": "2024-01-15T12:00:00",
        }, headers=auth_headers(token))
        assert resp.status_code == 201
        data = resp.json()
        assert data["amount"] == 25.50
        assert data["category"] == "Food & Drink"

    def test_list_expenses(self, client):
        token = register_and_login(client, "grace@example.com")
        headers = auth_headers(token)
        client.post("/expenses", json={"amount": 10, "category": "Transport", "note": "Bus", "date": "2024-01-10T08:00:00"}, headers=headers)
        client.post("/expenses", json={"amount": 50, "category": "Shopping", "note": "Books", "date": "2024-01-11T10:00:00"}, headers=headers)

        resp = client.get("/expenses", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_filter_by_category(self, client):
        token = register_and_login(client, "heidi@example.com")
        headers = auth_headers(token)
        client.post("/expenses", json={"amount": 10, "category": "Transport", "note": "Taxi", "date": "2024-01-10T08:00:00"}, headers=headers)
        client.post("/expenses", json={"amount": 20, "category": "Food & Drink", "note": "Dinner", "date": "2024-01-11T20:00:00"}, headers=headers)

        resp = client.get("/expenses?category=Transport", headers=headers)
        assert resp.status_code == 200
        expenses = resp.json()
        assert len(expenses) == 1
        assert expenses[0]["category"] == "Transport"

    def test_update_expense(self, client):
        token = register_and_login(client, "ivan@example.com")
        headers = auth_headers(token)
        create_resp = client.post("/expenses", json={"amount": 30, "category": "Health", "note": "Gym", "date": "2024-01-05T09:00:00"}, headers=headers)
        exp_id = create_resp.json()["id"]

        resp = client.put(f"/expenses/{exp_id}", json={"amount": 45, "category": "Health", "note": "Gym + sauna", "date": "2024-01-05T09:00:00"}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["amount"] == 45

    def test_delete_expense(self, client):
        token = register_and_login(client, "judy@example.com")
        headers = auth_headers(token)
        create_resp = client.post("/expenses", json={"amount": 5, "category": "Other", "note": "Misc", "date": "2024-01-01T00:00:00"}, headers=headers)
        exp_id = create_resp.json()["id"]

        resp = client.delete(f"/expenses/{exp_id}", headers=headers)
        assert resp.status_code == 204

        list_resp = client.get("/expenses", headers=headers)
        assert len(list_resp.json()) == 0

    def test_cannot_access_other_users_expense(self, client):
        token_a = register_and_login(client, "alice2@example.com")
        token_b = register_and_login(client, "bob2@example.com")

        create_resp = client.post("/expenses", json={"amount": 100, "category": "Housing", "note": "Rent", "date": "2024-01-01T00:00:00"}, headers=auth_headers(token_a))
        exp_id = create_resp.json()["id"]

        resp = client.delete(f"/expenses/{exp_id}", headers=auth_headers(token_b))
        assert resp.status_code == 404


# ── Budget tests ──────────────────────────────────────────────────────────────

class TestBudget:
    def test_get_budget_creates_default(self, client):
        token = register_and_login(client, "kevin@example.com")
        resp = client.get("/budget", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["monthly_limit"] == 2000.0

    def test_update_budget(self, client):
        token = register_and_login(client, "lena@example.com")
        headers = auth_headers(token)
        resp = client.put("/budget", json={"monthly_limit": 3500}, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["monthly_limit"] == 3500

        get_resp = client.get("/budget", headers=headers)
        assert get_resp.json()["monthly_limit"] == 3500


# ── Analytics tests ───────────────────────────────────────────────────────────

class TestAnalytics:
    def test_summary_empty(self, client):
        token = register_and_login(client, "mike@example.com")
        resp = client.get("/analytics/summary?month=1&year=2024", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["expense_count"] == 0

    def test_summary_with_expenses(self, client):
        token = register_and_login(client, "nina@example.com")
        headers = auth_headers(token)
        client.post("/expenses", json={"amount": 20, "category": "Food & Drink", "note": "a", "date": "2024-03-05T12:00:00"}, headers=headers)
        client.post("/expenses", json={"amount": 30, "category": "Transport", "note": "b", "date": "2024-03-10T08:00:00"}, headers=headers)
        client.post("/expenses", json={"amount": 999, "category": "Housing", "note": "c", "date": "2024-04-01T00:00:00"}, headers=headers)  # different month

        resp = client.get("/analytics/summary?month=3&year=2024", headers=headers)
        data = resp.json()
        assert data["total"] == 50
        assert data["expense_count"] == 2
        assert "Food & Drink" in data["by_category"]
        assert "Transport" in data["by_category"]
        assert "Housing" not in data["by_category"]
