"""Break Thunder掲示板エンドポイント。"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

import state.break_thunder as bt_state
from state.events import get_event
from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/break-thunder", tags=["Break Thunder 掲示板"])


class ActiveResponse(BaseModel):
    active: bool
    schedule_id: int | None = None
    ends_at: str | None = None


class MessageItem(BaseModel):
    id: int
    schedule_id: int
    user_id: int
    user_name: str
    body: str
    created_at: str


class MessagesResponse(BaseModel):
    active: ActiveResponse
    messages: list[MessageItem]


class PostMessageRequest(BaseModel):
    body: str


def _get_active_state(team_name: str) -> ActiveResponse:
    event = get_event(team_name)
    if event is None or event.get("event_type") != "time":
        return ActiveResponse(active=False)
    return ActiveResponse(
        active=True,
        schedule_id=bt_state.get_session_id(team_name),
        ends_at=event["ends_at"],
    )


@router.get("/active", response_model=ActiveResponse)
async def get_break_thunder_active(
    current_user: CurrentUser = Depends(get_current_user),
):
    return _get_active_state(current_user.team_name)


@router.get("/messages", response_model=MessagesResponse)
async def get_break_thunder_messages(
    current_user: CurrentUser = Depends(get_current_user),
):
    active = _get_active_state(current_user.team_name)
    messages = bt_state.get_messages(current_user.team_name) if active.active else []
    return MessagesResponse(
        active=active,
        messages=[MessageItem(**m) for m in messages],
    )


@router.post("/messages", response_model=MessageItem)
async def post_break_thunder_message(
    request: PostMessageRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    active = _get_active_state(current_user.team_name)
    if not active.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Break Thunderが開催中ではありません",
        )
    if not request.body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="メッセージを入力してください",
        )
    msg = bt_state.add_message(
        team_name=current_user.team_name,
        user_id=current_user.user_id,
        user_name=current_user.name,
        body=request.body,
    )
    return MessageItem(**msg)
