from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from main import app
from utils.auth import create_access_token

client = TestClient(app)


def test_google_login():
    """POST /api/v1/auth/google - Googleログインでアクセストークンとユーザー情報を取得"""
    # Google ID Token検証をモック
    mock_id_info = {
        "email": "test@example.com",
        "name": "テストユーザー",
        "iss": "accounts.google.com",
    }

    with patch("utils.auth.id_token.verify_oauth2_token", return_value=mock_id_info):
        response = client.post("/api/v1/auth/google", json={"id_token": "dummy_google_id_token"})

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data

    # users テーブルのスキーマに従った検証
    assert data["user"]["id"] is not None
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "テストユーザー"
    assert data["user"]["role"] in ["member", "admin"]
    assert "created_at" in data["user"]
    assert "updated_at" in data["user"]


def test_google_login_invalid_token():
    """POST /api/v1/auth/google - 無効なGoogle ID Tokenでエラー"""
    # Google ID Token検証をモック（検証失敗）
    with patch("utils.auth.id_token.verify_oauth2_token", side_effect=ValueError("Invalid token")):
        response = client.post("/api/v1/auth/google", json={"id_token": "invalid_token"})

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "無効なGoogle ID Tokenです"


def test_get_current_user():
    """GET /api/v1/auth/me - 現在のユーザー情報を取得"""
    # テスト用のJWTトークンを生成
    test_token = create_access_token(
        data={"user_id": 1, "email": "test@example.com", "name": "テストユーザー"}
    )

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {test_token}"})
    assert response.status_code == 200
    data = response.json()

    # users テーブルのスキーマに従った検証
    assert "id" in data
    assert data["id"] == 1
    assert "email" in data
    assert data["email"] == "test@example.com"
    assert "name" in data
    assert data["name"] == "テストユーザー"
    assert "role" in data
    assert data["role"] in ["member", "admin"]
    assert "created_at" in data
    assert "updated_at" in data


def test_get_current_user_no_auth():
    """GET /api/v1/auth/me - 認証なしでエラー"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


def test_get_current_user_invalid_token():
    """GET /api/v1/auth/me - 無効なトークンでエラー"""
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
