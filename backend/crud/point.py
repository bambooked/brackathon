"""CRUD operations for Point models."""

from tortoise.expressions import F
from tortoise.transactions import in_transaction

from models import PointAccount, PointTransaction, User

BT_PRESENT_COST = 10
BT_TIME_COST = 50
BT_FEVER_COST = 150


async def _ensure_user(user_id: int) -> User:
    user = await User.get_or_none(id=user_id)
    if user is None:
        raise ValueError(f"ユーザーが見つかりません (id={user_id})")
    return user


async def _ensure_team_member(user_id: int, team_name: str) -> User:
    user = await _ensure_user(user_id)
    if user.team_name != team_name:
        raise ValueError("指定ユーザーは同じチームに所属していません")
    return user


async def _get_or_create_account(user_id: int) -> PointAccount:
    user = await _ensure_user(user_id)
    account, _ = await PointAccount.get_or_create(user=user, defaults={"balance": 100})
    return account


def _transaction_to_dict(transaction: PointTransaction) -> dict:
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "source_type": transaction.source_type,
        "source_id": transaction.source_id,
        "description": transaction.description,
        "created_at": transaction.created_at.isoformat(),
    }


async def _apply_points(
    user_id: int,
    amount: int,
    transaction_type: str,
    source_type: str | None = None,
    source_id: int | None = None,
    description: str | None = None,
) -> tuple[PointTransaction, PointAccount]:
    async with in_transaction():
        account = await _get_or_create_account(user_id)
        account.balance = F("balance") + amount
        await account.save(update_fields=["balance", "updated_at"])
        await account.refresh_from_db()

        transaction = await PointTransaction.create(
            user_id=user_id,
            amount=amount,
            transaction_type=transaction_type,
            source_type=source_type,
            source_id=source_id,
            description=description,
        )
        return transaction, account


async def present_bt(sender_id: int, receiver_id: int, team_name: str) -> dict:
    """BT手渡し処理"""
    if sender_id == receiver_id:
        raise ValueError("自分自身にBTを送ることはできません")
    await _ensure_team_member(sender_id, team_name)
    await _ensure_team_member(receiver_id, team_name)

    account = await _get_or_create_account(sender_id)
    if account.balance < BT_PRESENT_COST:
        raise ValueError(
            f"ポイントが不足しています（必要: {BT_PRESENT_COST}PT、現在: {account.balance}PT）"
        )

    transaction, account = await _apply_points(
        user_id=sender_id,
        amount=-BT_PRESENT_COST,
        transaction_type="point_exchange",
        source_type="present",
        source_id=receiver_id,
        description=f"ユーザー {receiver_id} にBTを手渡し",
    )

    return {
        "message": f"ユーザー {receiver_id} にBTを手渡しました（{BT_PRESENT_COST}ポイント消費）",
        "sender_transaction": _transaction_to_dict(transaction),
        "sender_balance": account.balance,
    }


async def get_point_status(user_id: int, team_name: str | None = None) -> dict:
    """ポイント残高を取得"""
    if team_name is not None:
        await _ensure_team_member(user_id, team_name)
    account = await _get_or_create_account(user_id)
    return {
        "balance": account.balance,
        "created_at": account.created_at.isoformat(),
        "updated_at": account.updated_at.isoformat(),
    }


async def trigger_event(user_id: int, event_type: str) -> dict:
    """イベント発動"""
    if event_type == "time":
        cost = BT_TIME_COST
        message = "BTtimeを発動しました！チーム全体が休憩モードになりました"
    else:
        cost = BT_FEVER_COST
        message = "BTfeverを発動しました！チーム全体がお祭りモードになりました"

    account = await _get_or_create_account(user_id)
    if account.balance < cost:
        raise ValueError(
            f"ポイントが不足しています（必要: {cost}PT、現在: {account.balance}PT）"
        )

    transaction, account = await _apply_points(
        user_id=user_id,
        amount=-cost,
        transaction_type="point_exchange",
        source_type="event_trigger",
        description=f"BT{event_type}を発動",
    )

    return {
        "message": message,
        "event_type": event_type,
        "points_consumed": cost,
        "transaction": _transaction_to_dict(transaction),
        "user_balance": account.balance,
    }


async def get_point_history(user_id: int, team_name: str | None = None) -> dict:
    """ポイント履歴を取得"""
    if team_name is not None:
        await _ensure_team_member(user_id, team_name)
    else:
        await _ensure_user(user_id)
    transactions = await PointTransaction.filter(user_id=user_id).order_by("-created_at")
    transaction_dicts = [_transaction_to_dict(t) for t in transactions]
    total_earned = sum(t["amount"] for t in transaction_dicts if t["amount"] > 0)
    total_spent = abs(sum(t["amount"] for t in transaction_dicts if t["amount"] < 0))

    return {
        "transactions": transaction_dicts,
        "total_earned": total_earned,
        "total_spent": total_spent,
    }


async def get_users_points(team_name: str | None = None) -> list[dict]:
    """ユーザーのポイント一覧を取得"""
    query = User.all()
    if team_name is not None:
        query = query.filter(team_name=team_name)

    users = await query.order_by("id")
    results = []
    for user in users:
        account = await _get_or_create_account(user.id)
        results.append(
            {
                "user_id": user.id,
                "user_name": user.nickname if user.use_nickname and user.nickname else user.name,
                "balance": account.balance,
            }
        )
    return results
