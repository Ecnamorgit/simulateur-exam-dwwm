"""Tests de la relation N:N users <-> badges (Phase 4.2)."""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

BASE = "/api"


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # lifespan -> init_db + seed des badges
        yield c


def _auth_headers(client) -> dict:
    email = f"badge_{uuid.uuid4().hex[:12]}@test.com"
    client.post(f"{BASE}/auth/register", json={"email": email, "password": "motdepasse123"})
    token = client.post(f"{BASE}/auth/login", json={"email": email, "password": "motdepasse123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_badges_seeded(client):
    r = client.get(f"{BASE}/badges")
    assert r.status_code == 200
    codes = {b["code"] for b in r.json()}
    assert {"front-end", "back-end", "anglais", "examen-blanc"}.issubset(codes)


def test_my_badges_requires_auth(client):
    assert client.get(f"{BASE}/badges/me").status_code == 401


def test_award_badge_and_idempotent(client):
    h = _auth_headers(client)
    assert client.get(f"{BASE}/badges/me", headers=h).json() == []
    client.post(f"{BASE}/badges/me/front-end", headers=h)
    client.post(f"{BASE}/badges/me/front-end", headers=h)  # 2e fois -> pas de doublon
    mine = client.get(f"{BASE}/badges/me", headers=h).json()
    assert [b["code"] for b in mine] == ["front-end"]


def test_award_unknown_badge_404(client):
    h = _auth_headers(client)
    assert client.post(f"{BASE}/badges/me/inexistant", headers=h).status_code == 404


def test_examen_blanc_auto_awards_badge(client):
    h = _auth_headers(client)
    client.post(f"{BASE}/certification/sessions", headers=h, json={
        "duration_seconds": 7200, "score": 82, "transcript": "bilan", "status": "s", "exam_part": "examen-blanc",
    })
    mine = {b["code"] for b in client.get(f"{BASE}/badges/me", headers=h).json()}
    assert "examen-blanc" in mine


def test_low_score_examen_blanc_no_badge(client):
    h = _auth_headers(client)
    client.post(f"{BASE}/certification/sessions", headers=h, json={
        "duration_seconds": 7200, "score": 40, "transcript": "bilan", "status": "s", "exam_part": "examen-blanc",
    })
    mine = {b["code"] for b in client.get(f"{BASE}/badges/me", headers=h).json()}
    assert "examen-blanc" not in mine
