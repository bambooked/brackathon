from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from models import BreakThunderMessage, BreakThunderSchedule, User
from schemas.break_thunder import (
    BreakThunderActiveResponse,
    BreakThunderMessageCreateRequest,
    BreakThunderMessageItem,
    BreakThunderMessagesResponse,
)
from utils.dependencies import CurrentUser, get_current_user

ACTIVE_MINUTES = 15

router = APIRouter(prefix="/api/v1/break-thunder", tags=["Break Thunder"])


async def _get_active_schedule(team_name: str) -> tuple[BreakThunderSchedule, datetime] | None:
    now = datetime.now(UTC)
    window_start = now - timedelta(minutes=ACTIVE_MINUTES)
    schedule = await (
        BreakThunderSchedule.filter(
            team_name=team_name,
            status="fired",
            scheduled_at__gte=window_start,
            scheduled_at__lte=now,
        )
        .order_by("-scheduled_at")
        .first()
    )
    if schedule is None:
        return None
    return schedule, schedule.scheduled_at + timedelta(minutes=ACTIVE_MINUTES)


def _message_to_item(message: BreakThunderMessage) -> BreakThunderMessageItem:
    user_name = (
        message.user.nickname
        if message.user.use_nickname and message.user.nickname
        else message.user.name
    )
    return BreakThunderMessageItem(
        id=message.id,
        schedule_id=message.schedule_id,
        user_id=message.user_id,
        user_name=user_name,
        body=message.body,
        created_at=message.created_at.isoformat(),
    )


@router.get("/active", response_model=BreakThunderActiveResponse)
async def get_active_break_thunder(
    current_user: CurrentUser = Depends(get_current_user),
):
    active = await _get_active_schedule(current_user.team_name)
    if active is None:
        return BreakThunderActiveResponse(active=False)
    schedule, ends_at = active
    return BreakThunderActiveResponse(
        active=True,
        schedule_id=schedule.id,
        ends_at=ends_at.isoformat(),
    )


@router.get("/messages", response_model=BreakThunderMessagesResponse)
async def get_messages(current_user: CurrentUser = Depends(get_current_user)):
    active = await _get_active_schedule(current_user.team_name)
    if active is None:
        return BreakThunderMessagesResponse(active=False, messages=[])

    schedule, ends_at = active
    visible_since = datetime.now(UTC) - timedelta(minutes=ACTIVE_MINUTES)
    messages = await (
        BreakThunderMessage.filter(
            team_name=current_user.team_name,
            schedule_id=schedule.id,
            created_at__gte=visible_since,
        )
        .select_related("user")
        .order_by("created_at")
    )
    return BreakThunderMessagesResponse(
        active=True,
        schedule_id=schedule.id,
        ends_at=ends_at.isoformat(),
        messages=[_message_to_item(message) for message in messages],
    )


@router.post("/messages", response_model=BreakThunderMessageItem)
async def create_message(
    request: BreakThunderMessageCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    active = await _get_active_schedule(current_user.team_name)
    if active is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Break Thunder 掲示板は開催中のみ投稿できます",
        )

    body = request.body.strip()
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="本文を入力してください",
        )

    schedule, _ = active
    user = await User.get(id=current_user.user_id)
    message = await BreakThunderMessage.create(
        team_name=current_user.team_name,
        schedule=schedule,
        user=user,
        body=body,
    )
    full = await BreakThunderMessage.get(id=message.id).select_related("user")
    return _message_to_item(full)
