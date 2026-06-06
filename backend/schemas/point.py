"""Point related Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


class PointTransaction(BaseModel):
    """point_transactions テーブルに対応するスキーマ"""

    id: int
    user_id: int
    amount: int  # 正負の値
    transaction_type: str
    source_type: str | None = None
    source_id: int | None = None
    description: str | None = None
    created_at: str


class PointAccount(BaseModel):
    """point_accounts テーブルに対応するスキーマ"""

    id: int
    user_id: int
    balance: int
    created_at: str
    updated_at: str


class PresentBTRequest(BaseModel):
    """BT手渡しリクエスト（amountは不要、固定値10ポイント消費）"""

    receiver_id: int


class PresentBTResponse(BaseModel):
    """BT手渡しレスポンス（送信者のみポイント消費）"""

    message: str
    sender_transaction: PointTransaction
    sender_balance: int


class PointsStatusResponse(BaseModel):
    """現在のポイント残高（point_accounts）"""

    balance: int
    created_at: str
    updated_at: str


class PointHistoryResponse(BaseModel):
    """ポイント履歴（point_transactions）"""

    transactions: list[PointTransaction]
    total_earned: int
    total_spent: int


class UserPointSummary(BaseModel):
    """ユーザーのポイントサマリー"""

    user_id: int
    user_name: str
    balance: int


class UsersPointsResponse(BaseModel):
    """全ユーザーのポイント一覧"""

    users: list[UserPointSummary]


class BreakThunderRequest(BaseModel):
    """Break Thunder 発動リクエスト。scheduled_at 省略時は即時発動。"""

    scheduled_at: datetime | None = None


class TriggerEventResponse(BaseModel):
    """イベント発動レスポンス（time/fever共通）"""

    message: str
    event_type: str  # "time" or "fever"
    points_consumed: int
    transaction: PointTransaction
    user_balance: int
    scheduled_at: str | None = None  # Break Thunder のみ。即時発動の場合は None
