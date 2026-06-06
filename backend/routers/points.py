from fastapi import APIRouter, Depends

import crud.point as point_crud
from schemas.point import (
    PointHistoryResponse,
    PointsStatusResponse,
    PointTransaction,
    PresentBTRequest,
    PresentBTResponse,
    TriggerEventResponse,
    UserPointSummary,
    UsersPointsResponse,
)
from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/points", tags=["ポイント・手渡し"])


@router.post("/present", response_model=PresentBTResponse)
async def present_bt(
    request: PresentBTRequest, current_user: CurrentUser = Depends(get_current_user)
):
    """
    他のユーザーにBTを手渡し（モック）
    - 送信者のみ固定10ポイント消費
    - 受信者はリアルBTを受け取るだけでアプリ内ポイントは増減なし
    - point_transactions には送信者のマイナス履歴1件のみ記録
    - 同じチームのユーザーにのみ送信可能（TODO: DB実装時にバリデーション追加）
    """
    result = await point_crud.present_bt(
        sender_id=current_user.user_id,
        receiver_id=request.receiver_id,
    )

    return PresentBTResponse(
        message=result["message"],
        sender_transaction=PointTransaction(**result["sender_transaction"]),
        sender_balance=result["sender_balance"],
    )


@router.get("/status", response_model=PointsStatusResponse)
async def get_points_status(
    user_id: int | None = None, current_user: CurrentUser = Depends(get_current_user)
):
    """
    ポイント残高を取得（モック）
    - user_id指定なし: 自分の残高
    - user_id指定あり: 指定ユーザーの残高（同じチームのユーザーのみ、TODO: DB実装時にバリデーション追加）
    """
    target_user_id = user_id if user_id is not None else current_user.user_id
    result = await point_crud.get_point_status(target_user_id)

    return PointsStatusResponse(**result)


@router.post("/time", response_model=TriggerEventResponse)
async def trigger_bt_time(current_user: CurrentUser = Depends(get_current_user)):
    """
    BTtime（休憩）を発動（モック）
    - 自分のポイントを50ポイント消費
    - 同じチーム全体をBTtime状態にする
    """
    result = await point_crud.trigger_event(
        user_id=current_user.user_id,
        event_type="time",
    )

    return TriggerEventResponse(
        message=result["message"],
        event_type=result["event_type"],
        points_consumed=result["points_consumed"],
        transaction=PointTransaction(**result["transaction"]),
        user_balance=result["user_balance"],
    )


@router.post("/fever", response_model=TriggerEventResponse)
async def trigger_bt_fever(current_user: CurrentUser = Depends(get_current_user)):
    """
    BTfever（お祭り）を発動（モック）
    - 自分のポイントを150ポイント消費
    - 同じチーム全体をBTfever状態にする
    """
    result = await point_crud.trigger_event(
        user_id=current_user.user_id,
        event_type="fever",
    )

    return TriggerEventResponse(
        message=result["message"],
        event_type=result["event_type"],
        points_consumed=result["points_consumed"],
        transaction=PointTransaction(**result["transaction"]),
        user_balance=result["user_balance"],
    )


@router.get("/history", response_model=PointHistoryResponse)
async def get_point_history(
    user_id: int | None = None, current_user: CurrentUser = Depends(get_current_user)
):
    """
    ポイント履歴を取得（モック）
    - user_id指定なし: 自分の履歴
    - user_id指定あり: 指定ユーザーの履歴（同じチームのユーザーのみ、TODO: DB実装時にバリデーション追加）
    """
    target_user_id = user_id if user_id is not None else current_user.user_id
    result = await point_crud.get_point_history(target_user_id)

    return PointHistoryResponse(
        transactions=[PointTransaction(**t) for t in result["transactions"]],
        total_earned=result["total_earned"],
        total_spent=result["total_spent"],
    )


@router.get("/users", response_model=UsersPointsResponse)
async def get_users_points(current_user: CurrentUser = Depends(get_current_user)):
    """
    全ユーザーのポイント残高一覧を取得（モック）
    - point_accounts と users テーブルを JOIN
    - 同じチームのユーザーのみ返す
    """
    users = await point_crud.get_users_points()

    # NOTE: 実際のDB実装では、users テーブルと JOIN して team_name でフィルタリング
    # モックでは簡易的に全ユーザーを返す（本来は team_name が必要）
    # TODO: DB実装時に team_name フィールドを追加してフィルタリング
    return UsersPointsResponse(
        users=[UserPointSummary(**u) for u in users]
    )
