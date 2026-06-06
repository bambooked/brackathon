from fastapi import APIRouter, Header
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/points", tags=["ポイント・手渡し"])


# リクエスト・レスポンスのスキーマ定義


class PointTransaction(BaseModel):
    """point_transactions テーブルに対応するスキーマ"""

    id: int
    user_id: int
    amount: int  # 正負の値
    transaction_type: (
        str  # reaction_received / reaction_given / point_exchange / manual_adjustment など
    )
    source_type: str | None = None
    source_id: int | None = None
    description: str | None = None
    created_at: str


class PointAccount(BaseModel):
    """point_accounts テーブルに対応するスキーマ"""

    id: int
    user_id: int
    balance: int  # 現在のポイント残高
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
    total_earned: int  # 累計獲得ポイント
    total_spent: int  # 累計消費ポイント


class UserPointSummary(BaseModel):
    """ユーザーのポイントサマリー"""

    user_id: int
    user_name: str
    balance: int


class UsersPointsResponse(BaseModel):
    """全ユーザーのポイント一覧"""

    users: list[UserPointSummary]


class TriggerEventResponse(BaseModel):
    """イベント発動レスポンス（time/fever共通）"""

    message: str
    event_type: str  # "time" or "fever"
    points_consumed: int
    transaction: PointTransaction
    user_balance: int


@router.post("/present", response_model=PresentBTResponse)
async def present_bt(request: PresentBTRequest, authorization: str | None = Header(None)):
    """
    他のユーザーにBTを手渡し（モック）
    - 送信者のみ固定10ポイント消費
    - 受信者はリアルBTを受け取るだけでアプリ内ポイントは増減なし
    - point_transactions には送信者のマイナス履歴1件のみ記録
    """
    BT_PRESENT_COST = 10  # BT1個あたりの消費ポイント

    sender_transaction = PointTransaction(
        id=1,
        user_id=1,  # 送信者
        amount=-BT_PRESENT_COST,  # 負の値（固定10ポイント）
        transaction_type="point_exchange",
        source_type="present",
        source_id=request.receiver_id,
        description=f"ユーザー {request.receiver_id} にBTを手渡し",
        created_at="2026-06-06T10:00:00Z",
    )

    return PresentBTResponse(
        message=f"ユーザー {request.receiver_id} にBTを手渡しました（{BT_PRESENT_COST}ポイント消費）",
        sender_transaction=sender_transaction,
        sender_balance=90,  # point_accounts の更新後残高
    )


@router.get("/status", response_model=PointsStatusResponse)
async def get_points_status(user_id: int | None = None, authorization: str | None = Header(None)):
    """
    ポイント残高を取得（モック）
    - user_id指定なし: 自分の残高
    - user_id指定あり: 指定ユーザーの残高
    """
    # user_idが指定されていない場合は自分（user_id=1）とする
    target_user_id = user_id if user_id is not None else 1

    # モック: user_idに応じて異なる残高を返す
    balance_map = {1: 150, 2: 120, 3: 110, 4: 95, 5: 80}
    balance = balance_map.get(target_user_id, 100)

    return PointsStatusResponse(
        balance=balance, created_at="2026-01-01T00:00:00Z", updated_at="2026-06-06T10:00:00Z"
    )


@router.post("/time", response_model=TriggerEventResponse)
async def trigger_bt_time(authorization: str | None = Header(None)):
    """
    BTtime（休憩）を発動（モック）
    - 自分のポイントを50ポイント消費
    - チーム全体をBTtime状態にする
    """
    TIME_COST = 50

    transaction = PointTransaction(
        id=101,
        user_id=1,
        amount=-TIME_COST,
        transaction_type="point_exchange",
        source_type="event_trigger",
        source_id=None,
        description="BTtimeを発動",
        created_at="2026-06-06T10:00:00Z",
    )

    return TriggerEventResponse(
        message="BTtimeを発動しました！チーム全体が休憩モードになりました",
        event_type="time",
        points_consumed=TIME_COST,
        transaction=transaction,
        user_balance=100,  # 150 - 50
    )


@router.post("/fever", response_model=TriggerEventResponse)
async def trigger_bt_fever(authorization: str | None = Header(None)):
    """
    BTfever（お祭り）を発動（モック）
    - 自分のポイントを150ポイント消費
    - チーム全体をBTfever状態にする
    """
    FEVER_COST = 150

    transaction = PointTransaction(
        id=102,
        user_id=1,
        amount=-FEVER_COST,
        transaction_type="point_exchange",
        source_type="event_trigger",
        source_id=None,
        description="BTfeverを発動",
        created_at="2026-06-06T10:00:00Z",
    )

    return TriggerEventResponse(
        message="BTfeverを発動しました！チーム全体がお祭りモードになりました",
        event_type="fever",
        points_consumed=FEVER_COST,
        transaction=transaction,
        user_balance=0,  # 150 - 150
    )


@router.get("/history", response_model=PointHistoryResponse)
async def get_point_history(user_id: int | None = None, authorization: str | None = Header(None)):
    """
    ポイント履歴を取得（モック）
    - user_id指定なし: 自分の履歴
    - user_id指定あり: 指定ユーザーの履歴
    """
    # user_idが指定されていない場合は自分（user_id=1）とする
    target_user_id = user_id if user_id is not None else 1

    # モックデータ: 最近のトランザクション履歴
    mock_transactions = [
        PointTransaction(
            id=1,
            user_id=target_user_id,
            amount=10,
            transaction_type="reaction_received",
            source_type="reaction",
            source_id=5,
            description="日報にリアクションをもらった",
            created_at="2026-06-06T09:00:00Z",
        ),
        PointTransaction(
            id=2,
            user_id=target_user_id,
            amount=-10,
            transaction_type="point_exchange",
            source_type="present",
            source_id=2,
            description="ユーザー 2 にBTを手渡し",
            created_at="2026-06-06T10:00:00Z",
        ),
        PointTransaction(
            id=3,
            user_id=target_user_id,
            amount=15,
            transaction_type="reaction_received",
            source_type="ai_evaluation",
            source_id=10,
            description="日報のAI評価でポイント獲得",
            created_at="2026-06-05T18:00:00Z",
        ),
        PointTransaction(
            id=4,
            user_id=target_user_id,
            amount=-50,
            transaction_type="point_exchange",
            source_type="event_trigger",
            source_id=None,
            description="BTtimeを発動",
            created_at="2026-06-05T15:00:00Z",
        ),
    ]

    # 累計計算
    total_earned = sum(t.amount for t in mock_transactions if t.amount > 0)
    total_spent = abs(sum(t.amount for t in mock_transactions if t.amount < 0))

    return PointHistoryResponse(
        transactions=mock_transactions, total_earned=total_earned, total_spent=total_spent
    )


@router.get("/users", response_model=UsersPointsResponse)
async def get_users_points(authorization: str | None = Header(None)):
    """
    全ユーザーのポイント残高一覧を取得（モック）
    - point_accounts と users テーブルを JOIN
    """
    # モックデータ: チーム全体のポイント一覧
    mock_users = [
        UserPointSummary(user_id=1, user_name="テストユーザー", balance=150),
        UserPointSummary(user_id=2, user_name="山田太郎", balance=120),
        UserPointSummary(user_id=3, user_name="佐藤花子", balance=110),
        UserPointSummary(user_id=4, user_name="鈴木一郎", balance=95),
        UserPointSummary(user_id=5, user_name="田中美咲", balance=80),
    ]

    return UsersPointsResponse(users=mock_users)
