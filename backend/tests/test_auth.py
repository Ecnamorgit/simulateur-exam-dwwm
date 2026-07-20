"""Tests de l'authentification JWT + protection des sessions (Phase 4.1)."""

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from jose import jwt
from sqlalchemy import select

from app.main import app
from app.core.config import settings
from app.db.sqlite import async_session, User

BASE = "/api"


@pytest.fixture(scope="module")
def client():
    # Le context manager déclenche le lifespan -> init_db (crée la table users).
    with TestClient(app) as c:
        yield c


def _rand_email() -> str:
    return f"user_{uuid.uuid4().hex[:12]}@test.com"


def test_register_returns_user_without_password(client):
    email = _rand_email()
    r = client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == email
    assert "password" not in data and "password_hash" not in data


def test_register_short_password_rejected(client):
    r = client.post(f"{BASE}/auth/register", json={"email": _rand_email(), "password": "court"})
    assert r.status_code == 422


def test_register_duplicate_conflict(client):
    email = _rand_email()
    client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
    r = client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
    assert r.status_code == 409


def test_login_and_wrong_password(client):
    email = _rand_email()
    client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
    ok = client.post(f"{BASE}/auth/login", json={"email": email, "password": "motdepasse123"})
    assert ok.status_code == 200 and ok.json()["access_token"]
    bad = client.post(f"{BASE}/auth/login", json={"email": email, "password": "mauvais"})
    assert bad.status_code == 401


def test_sessions_require_auth(client):
    assert client.get(f"{BASE}/certification/sessions").status_code == 401
    assert client.post(f"{BASE}/certification/sessions", json={
        "duration_seconds": 1, "score": 1, "transcript": "t", "status": "s"
    }).status_code == 401


def test_sessions_scoped_to_user(client):
    # Deux utilisateurs : chacun ne voit que SES sessions.
    def token(email):
        client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
        return client.post(f"{BASE}/auth/login", json={"email": email, "password": "motdepasse123"}).json()["access_token"]

    t1 = token(_rand_email())
    t2 = token(_rand_email())
    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    client.post(f"{BASE}/certification/sessions", headers=h1, json={
        "duration_seconds": 10, "score": 80, "transcript": "user1", "status": "s", "exam_part": "examen-blanc"
    })
    r1 = client.get(f"{BASE}/certification/sessions", headers=h1)
    r2 = client.get(f"{BASE}/certification/sessions", headers=h2)
    assert r1.status_code == 200 and any(s["transcript"] == "user1" for s in r1.json())
    assert all(s["transcript"] != "user1" for s in r2.json())


def test_expired_token_rejected(client):
    expired = jwt.encode(
        {"sub": "ghost@test.com", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM,
    )
    r = client.get(f"{BASE}/certification/sessions", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_password_stored_hashed_in_db(client):
    email = _rand_email()
    password = "motdepasse123"
    client.post(f"{BASE}/auth/register", json={"email": email, "password": password})
    async with async_session() as db:
        user = (await db.execute(select(User).where(User.email == email))).scalar_one()
    assert user.password_hash != password
    assert user.password_hash.startswith("$2")  # préfixe bcrypt
