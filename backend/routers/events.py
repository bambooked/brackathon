"""SSEイベントストリームエンドポイント。"""

import asyncio
import json

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

import state.sse as sse_state
from utils.auth import verify_access_token

router = APIRouter(prefix="/api/v1/events", tags=["SSE"])


@router.get("/stream")
async def event_stream(token: str = Query(...)):
    """
    SSEストリームに接続する。
    EventSourceはAuthorizationヘッダーを送れないため ?token= クエリで認証する。
    接続中はチーム宛のイベントをリアルタイム配信し、30秒ごとにkeepaliveを送る。
    """
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なトークンです",
        )

    team_name: str = payload.get("team_name", "")
    queue = sse_state.subscribe(team_name)

    async def generate():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            sse_state.unsubscribe(queue)

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
