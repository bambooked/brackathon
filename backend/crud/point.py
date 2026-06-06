"""CRUD operations for Point models."""


async def present_bt(sender_id: int, receiver_id: int) -> dict:
    """BT手渡し処理（モック）"""
    BT_PRESENT_COST = 10

    return {
        "message": f"ユーザー {receiver_id} にBTを手渡しました（{BT_PRESENT_COST}ポイント消費）",
        "sender_transaction": {
            "id": 1,
            "user_id": sender_id,
            "amount": -BT_PRESENT_COST,
            "transaction_type": "point_exchange",
            "source_type": "present",
            "source_id": receiver_id,
            "description": f"ユーザー {receiver_id} にBTを手渡し",
            "created_at": "2026-06-06T10:00:00Z",
        },
        "sender_balance": 90,
    }


async def get_point_status(user_id: int) -> dict:
    """ポイント残高を取得（モック）"""
    balance_map = {1: 150, 2: 120, 3: 110, 4: 95, 5: 80}
    balance = balance_map.get(user_id, 100)

    return {
        "balance": balance,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-06-06T10:00:00Z",
    }


async def trigger_event(user_id: int, event_type: str) -> dict:
    """イベント発動（モック）"""
    if event_type == "time":
        cost = 50
        message = "BTtimeを発動しました！チーム全体が休憩モードになりました"
        balance = 100
    else:  # fever
        cost = 150
        message = "BTfeverを発動しました！チーム全体がお祭りモードになりました"
        balance = 0

    return {
        "message": message,
        "event_type": event_type,
        "points_consumed": cost,
        "transaction": {
            "id": 101 if event_type == "time" else 102,
            "user_id": user_id,
            "amount": -cost,
            "transaction_type": "point_exchange",
            "source_type": "event_trigger",
            "source_id": None,
            "description": f"BT{event_type}を発動",
            "created_at": "2026-06-06T10:00:00Z",
        },
        "user_balance": balance,
    }


async def get_point_history(user_id: int) -> dict:
    """ポイント履歴を取得（モック）"""
    mock_transactions = [
        {
            "id": 1,
            "user_id": user_id,
            "amount": 10,
            "transaction_type": "reaction_received",
            "source_type": "reaction",
            "source_id": 5,
            "description": "日報にリアクションをもらった",
            "created_at": "2026-06-06T09:00:00Z",
        },
        {
            "id": 2,
            "user_id": user_id,
            "amount": -10,
            "transaction_type": "point_exchange",
            "source_type": "present",
            "source_id": 2,
            "description": "ユーザー 2 にBTを手渡し",
            "created_at": "2026-06-06T10:00:00Z",
        },
        {
            "id": 3,
            "user_id": user_id,
            "amount": 15,
            "transaction_type": "reaction_received",
            "source_type": "ai_evaluation",
            "source_id": 10,
            "description": "日報のAI評価でポイント獲得",
            "created_at": "2026-06-05T18:00:00Z",
        },
        {
            "id": 4,
            "user_id": user_id,
            "amount": -50,
            "transaction_type": "point_exchange",
            "source_type": "event_trigger",
            "source_id": None,
            "description": "BTtimeを発動",
            "created_at": "2026-06-05T15:00:00Z",
        },
    ]

    total_earned = sum(t["amount"] for t in mock_transactions if t["amount"] > 0)
    total_spent = abs(sum(t["amount"] for t in mock_transactions if t["amount"] < 0))

    return {
        "transactions": mock_transactions,
        "total_earned": total_earned,
        "total_spent": total_spent,
    }


async def get_users_points() -> list[dict]:
    """全ユーザーのポイント一覧を取得（モック）"""
    return [
        {"user_id": 1, "user_name": "テストユーザー", "balance": 150},
        {"user_id": 2, "user_name": "山田太郎", "balance": 120},
        {"user_id": 3, "user_name": "佐藤花子", "balance": 110},
        {"user_id": 4, "user_name": "鈴木一郎", "balance": 95},
        {"user_id": 5, "user_name": "田中美咲", "balance": 80},
    ]
