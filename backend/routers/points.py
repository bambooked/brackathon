from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/v1/points", tags=["ポイント・手渡し"])


# リクエスト・レスポンスのスキーマ定義

class PointTransaction(BaseModel):
    """point_transactions テーブルに対応するスキーマ"""
    id: int
    user_id: int
    amount: int  # 正負の値
    transaction_type: str  # reaction_received / reaction_given / point_exchange / manual_adjustment など
    source_type: Optional[str] = None
    source_id: Optional[int] = None
    description: Optional[str] = None
    created_at: str


class PointAccount(BaseModel):
    """point_accounts テーブルに対応するスキーマ"""
    id: int
    user_id: int
    balance: int  # 現在のポイント残高
    created_at: str
    updated_at: str


class PresentBTRequest(BaseModel):
    receiver_id: int
    amount: int


class PresentBTResponse(BaseModel):
    message: str
    sender_transaction: PointTransaction
    receiver_transaction: PointTransaction
    sender_balance: int
    receiver_balance: int


class PointsStatusResponse(BaseModel):
    """現在のポイント状況 (point_accounts)"""
    balance: int
    created_at: str
    updated_at: str


class PointExchangeRequest(BaseModel):
    item_key: str  # snack_box / coffee_ticket など
    item_name: str
    points_spent: int


class PointExchangeResponse(BaseModel):
    """point_exchanges テーブルに対応するスキーマ"""
    id: int
    user_id: int
    item_key: str
    item_name: str
    points_spent: int
    status: str  # requested / approved / completed / canceled
    note: Optional[str] = None
    requested_at: str


@router.post("/present", response_model=PresentBTResponse)
async def present_bt(request: PresentBTRequest, authorization: Optional[str] = Header(None)):
    """
    他のユーザーにBTを手渡し - ポイントを消費/付与（モック）
    point_transactions に2件のレコードを作成する想定
    """
    sender_transaction = PointTransaction(
        id=1,
        user_id=1,  # 送信者
        amount=-request.amount,  # 負の値
        transaction_type="point_exchange",
        source_type="present",
        source_id=request.receiver_id,
        description=f"ユーザー {request.receiver_id} にBTを手渡し",
        created_at="2026-06-06T10:00:00Z"
    )

    receiver_transaction = PointTransaction(
        id=2,
        user_id=request.receiver_id,  # 受信者
        amount=request.amount,  # 正の値
        transaction_type="point_exchange",
        source_type="present",
        source_id=1,  # 送信者のID
        description=f"ユーザー 1 からBTを受け取り",
        created_at="2026-06-06T10:00:00Z"
    )

    return PresentBTResponse(
        message=f"ユーザー {request.receiver_id} に {request.amount} ポイントを手渡しました",
        sender_transaction=sender_transaction,
        receiver_transaction=receiver_transaction,
        sender_balance=90,  # point_accounts の更新後残高
        receiver_balance=110
    )


@router.get("/status", response_model=PointsStatusResponse)
async def get_points_status(authorization: Optional[str] = Header(None)):
    """
    現在のポイント状況を取得 (point_accounts)（モック）
    """
    return PointsStatusResponse(
        balance=150,
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-06-06T10:00:00Z"
    )


@router.post("/exchange", response_model=PointExchangeResponse)
async def exchange_points(request: PointExchangeRequest, authorization: Optional[str] = Header(None)):
    """
    ポイントを景品と交換 (point_exchanges)（モック）
    """
    return PointExchangeResponse(
        id=1,
        user_id=1,
        item_key=request.item_key,
        item_name=request.item_name,
        points_spent=request.points_spent,
        status="requested",
        note=None,
        requested_at="2026-06-06T10:00:00Z"
    )
