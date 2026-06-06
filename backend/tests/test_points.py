import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_present_bt():
    """POST /api/v1/points/present - 他のユーザーにBTを手渡し"""
    response = client.post(
        "/api/v1/points/present",
        json={
            "receiver_id": 2,
            "amount": 10
        },
        headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    # point_transactions と point_accounts のスキーマに従った検証
    assert "sender_transaction" in data
    assert data["sender_transaction"]["amount"] < 0  # 負の値
    assert data["sender_transaction"]["transaction_type"] is not None
    assert "receiver_transaction" in data
    assert data["receiver_transaction"]["amount"] > 0  # 正の値
    assert "sender_balance" in data
    assert "receiver_balance" in data


def test_get_points_status():
    """GET /api/v1/points/status - ポイント状況を取得"""
    response = client.get(
        "/api/v1/points/status",
        headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()
    # point_accounts のスキーマに従った検証
    assert "balance" in data
    assert isinstance(data["balance"], int)
    assert "created_at" in data
    assert "updated_at" in data


def test_exchange_points():
    """POST /api/v1/points/exchange - ポイントを景品と交換"""
    response = client.post(
        "/api/v1/points/exchange",
        json={
            "item_key": "snack_box",
            "item_name": "ブラックサンダーBOX",
            "points_spent": 50
        },
        headers={"Authorization": "Bearer dummy_jwt_token"}
    )
    assert response.status_code == 200
    data = response.json()
    # point_exchanges のスキーマに従った検証
    assert "id" in data
    assert "user_id" in data
    assert data["item_key"] == "snack_box"
    assert data["item_name"] == "ブラックサンダーBOX"
    assert data["points_spent"] == 50
    assert "status" in data
    assert data["status"] in ["requested", "approved", "completed", "canceled"]
    assert "requested_at" in data
