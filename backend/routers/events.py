"""SSE エンドポイント。"""

import asyncio
import json

from fastapi import APIRouter, HTTPException, Query, Request
from sse_starlette.sse import EventSourceResponse

from sse.manager import manager
from utils.auth import verify_access_token

router = APIRouter(prefix="/api/v1/events", tags=["SSE"])


@router.get("/stream")
async def stream_events(
    request: Request,
    token: str = Query(..., description="JWT アクセストークン"),
):
    """
    チーム向け SSE ストリーム。
    EventSource は Authorization ヘッダーを送れないため ?token= で認証する。
    """
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="無効なトークンです")

    team_name = payload.get("team_name")
    if not team_name:
        raise HTTPException(status_code=401, detail="トークンにチーム情報がありません")

    q: asyncio.Queue = asyncio.Queue()
    manager.add(team_name, q)

    async def generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    data = await asyncio.wait_for(q.get(), timeout=25.0)
                    yield {"data": json.dumps(data)}
                except asyncio.TimeoutError:
                    yield {"comment": "keepalive"}
        finally:
            manager.remove(team_name, q)

    return EventSourceResponse(generator())
