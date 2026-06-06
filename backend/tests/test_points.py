import pytest
from fastapi.testclient import TestClient

from main import app
from utils.auth import create_access_token

client = TestClient(app)

# テスト用のJWTトークンを生成
test_token = create_access_token(
    data={
        "user_id": 1,
        "email": "test@example.com",
        "name": "テストユーザー",
        "team_name": "チームA",
    }
)


def test_present_bt():
    """POST /api/v1/points/present - 他のユーザーにBTを手渡し（固定10ポイント消費）"""
    response = client.post(
        "/api/v1/points/present",
        json={"receiver_id": 2},  # amountは不要（固定値）
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data

    # 送信者のトランザクションのみ検証
    assert "sender_transaction" in data
    assert data["sender_transaction"]["amount"] == -10  # 固定10ポイント消費
    assert data["sender_transaction"]["transaction_type"] == "point_exchange"
    assert data["sender_transaction"]["source_type"] == "present"

    # 送信者の残高のみ
    assert "sender_balance" in data
    assert isinstance(data["sender_balance"], int)

    # 受信者のトランザクションと残高は不要（リアルBTを受け取るだけ）
    assert "receiver_transaction" not in data
    assert "receiver_balance" not in data


def test_get_points_status():
    """GET /api/v1/points/status - 自分のポイント残高を取得"""
    response = client.get(
        "/api/v1/points/status", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    # point_accounts のスキーマに従った検証
    assert "balance" in data
    assert isinstance(data["balance"], int)
    assert "created_at" in data
    assert "updated_at" in data

    # イベント状態は含まれない
    assert "is_fever" not in data
    assert "is_time" not in data


def test_trigger_bt_time():
    """POST /api/v1/points/time - BTtime（休憩）を発動"""
    response = client.post(
        "/api/v1/points/time", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    # イベント発動レスポンスの検証
    assert "message" in data
    assert "event_type" in data
    assert data["event_type"] == "time"
    assert "points_consumed" in data
    assert data["points_consumed"] == 50  # BTtime発動コスト

    # トランザクション検証
    assert "transaction" in data
    assert data["transaction"]["amount"] == -50
    assert data["transaction"]["transaction_type"] == "point_exchange"
    assert data["transaction"]["source_type"] == "event_trigger"

    # 残高検証
    assert "user_balance" in data
    assert isinstance(data["user_balance"], int)


def test_trigger_bt_fever():
    """POST /api/v1/points/fever - BTfever（お祭り）を発動"""
    response = client.post(
        "/api/v1/points/fever", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    # イベント発動レスポンスの検証
    assert "message" in data
    assert "event_type" in data
    assert data["event_type"] == "fever"
    assert "points_consumed" in data
    assert data["points_consumed"] == 150  # BTfever発動コスト

    # トランザクション検証
    assert "transaction" in data
    assert data["transaction"]["amount"] == -150
    assert data["transaction"]["transaction_type"] == "point_exchange"
    assert data["transaction"]["source_type"] == "event_trigger"

    # 残高検証
    assert "user_balance" in data
    assert isinstance(data["user_balance"], int)


def test_get_point_history():
    """GET /api/v1/points/history - 自分のポイント履歴を取得"""
    response = client.get(
        "/api/v1/points/history", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    # レスポンス構造の検証
    assert "transactions" in data
    assert isinstance(data["transactions"], list)
    assert "total_earned" in data
    assert isinstance(data["total_earned"], int)
    assert "total_spent" in data
    assert isinstance(data["total_spent"], int)

    # トランザクション詳細の検証
    if len(data["transactions"]) > 0:
        transaction = data["transactions"][0]
        assert "id" in transaction
        assert "user_id" in transaction
        assert "amount" in transaction
        assert "transaction_type" in transaction
        assert "created_at" in transaction


def test_get_users_points():
    """GET /api/v1/points/users - 全ユーザーのポイント一覧を取得"""
    response = client.get(
        "/api/v1/points/users", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    # レスポンス構造の検証
    assert "users" in data
    assert isinstance(data["users"], list)

    # ユーザー詳細の検証
    if len(data["users"]) > 0:
        user = data["users"][0]
        assert "user_id" in user
        assert "user_name" in user
        assert "balance" in user
        assert isinstance(user["balance"], int)
        # rankは含まれない
        assert "rank" not in user


def test_get_points_status_with_user_id():
    """GET /api/v1/points/status?user_id=2 - 特定ユーザーのポイント残高を取得"""
    response = client.get(
        "/api/v1/points/status?user_id=2", headers={"Authorization": f"Bearer {test_token}"}
    )
    assert response.status_code == 200
    data = response.json()

    assert "balance" in data
    assert data["balance"] == 120  # user_id=2の残高


def test_get_point_history_with_user_id():
    """GET /api/v1/points/history?user_id=3 - 特定ユーザーのポイント履歴を取得"""
    response = client.get(
        "/api/v1/points/history?user_id=3",
        headers={"Authorization": f"Bearer {test_token}"},
    )
    assert response.status_code == 200
    data = response.json()

    assert "transactions" in data
    # user_id=3の履歴が返される
    if len(data["transactions"]) > 0:
        assert data["transactions"][0]["user_id"] == 3
