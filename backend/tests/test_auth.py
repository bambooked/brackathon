import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_google_login():
    """POST /api/v1/auth/google - Googleログインでアクセストークンとユーザー情報を取得"""
    response = client.post(
        "/api/v1/auth/google",
        json={"id_token": "dummy_google_id_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data
    # users テーブルのスキーマに従った検証
    assert data["user"]["id"] is not None
    assert data["user"]["email"] is not None
    assert data["user"]["name"] is not None
    assert data["user"]["role"] in ["member", "admin"]
    assert "created_at" in data["user"]
    assert "updated_at" in data["user"]


def test_get_current_user():
    """GET /api/v1/auth/me - 現在のユーザー情報を取得"""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()
    # users テーブルのスキーマに従った検証
    assert "id" in data
    assert "email" in data
    assert "name" in data
    assert "role" in data
    assert data["role"] in ["member", "admin"]
    assert "created_at" in data
    assert "updated_at" in data
