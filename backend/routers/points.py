from datetime import UTC, datetime

from fastapi import APIRouter, Body, Depends, HTTPException, status

import crud.point as point_crud
from models import BreakThunderSchedule
from scheduler import broadcast_bt_fever, fire_break_thunder, scheduler
from schemas.point import (
    BreakThunderRequest,
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
    他のユーザーにBTを手渡し
    - 送信者のみ固定10ポイント消費
    - 受信者はリアルBTを受け取るだけでアプリ内ポイントは増減なし
    - point_transactions には送信者のマイナス履歴1件のみ記録
    - 同じチームのユーザーにのみ送信可能（自分自身へは送付不可）
    """
    try:
        result = await point_crud.present_bt(
            sender_id=current_user.user_id,
            receiver_id=request.receiver_id,
            team_name=current_user.team_name,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

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
    ポイント残高を取得
    - user_id指定なし: 自分の残高
    - user_id指定あり: 指定ユーザーの残高（同じチームのユーザーのみ）
    """
    target_user_id = user_id if user_id is not None else current_user.user_id
    try:
        result = await point_crud.get_point_status(target_user_id, current_user.team_name)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    return PointsStatusResponse(**result)


@router.post("/time", response_model=TriggerEventResponse)
async def trigger_bt_time(
    body: BreakThunderRequest | None = Body(default=None),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Break Thunder（休憩）を発動
    - 自分のポイントを50ポイント消費
    - scheduled_at 省略 or 現在時刻以前: 即時 SSE ブロードキャスト
    - scheduled_at が未来の時刻: その時刻に SSE ブロードキャストを予約
    """
    try:
        result = await point_crud.trigger_event(
            user_id=current_user.user_id,
            event_type="time",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    scheduled_at = body.scheduled_at if body else None
    now = datetime.now(UTC)
    fire_at = scheduled_at or now

    schedule = await BreakThunderSchedule.create(
        team_name=current_user.team_name,
        triggered_by_user_id=current_user.user_id,
        scheduled_at=fire_at,
        status="pending",
    )

    if fire_at <= now:
        await fire_break_thunder(schedule.id, current_user.team_name)
    else:
        scheduler.add_job(
            fire_break_thunder,
            "date",
            run_date=fire_at,
            args=[schedule.id, current_user.team_name],
            misfire_grace_time=60,
        )

    return TriggerEventResponse(
        message=result["message"],
        event_type=result["event_type"],
        points_consumed=result["points_consumed"],
        transaction=PointTransaction(**result["transaction"]),
        user_balance=result["user_balance"],
        scheduled_at=scheduled_at.isoformat() if scheduled_at and scheduled_at > now else None,
    )


@router.post("/fever", response_model=TriggerEventResponse)
async def trigger_bt_fever(current_user: CurrentUser = Depends(get_current_user)):
    """
    BTfever（お祭り）を発動
    - 自分のポイントを150ポイント消費
    - 即時 SSE ブロードキャスト（スケジュール不可）
    """
    try:
        result = await point_crud.trigger_event(
            user_id=current_user.user_id,
            event_type="fever",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    await broadcast_bt_fever(current_user.team_name)

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
    ポイント履歴を取得
    - user_id指定なし: 自分の履歴
    - user_id指定あり: 指定ユーザーの履歴（同じチームのユーザーのみ）
    """
    target_user_id = user_id if user_id is not None else current_user.user_id
    try:
        result = await point_crud.get_point_history(target_user_id, current_user.team_name)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        ) from exc

    return PointHistoryResponse(
        transactions=[PointTransaction(**t) for t in result["transactions"]],
        total_earned=result["total_earned"],
        total_spent=result["total_spent"],
    )


@router.get("/users", response_model=UsersPointsResponse)
async def get_users_points(current_user: CurrentUser = Depends(get_current_user)):
    """
    全ユーザーのポイント残高一覧を取得
    - point_accounts と users テーブルを JOIN
    - 同じチームのユーザーのみ返す
    """
    users = await point_crud.get_users_points(current_user.team_name)

    return UsersPointsResponse(
        users=[UserPointSummary(**u) for u in users]
    )
