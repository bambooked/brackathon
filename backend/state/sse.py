"""グローバルSSE配信管理。チームごとに購読者を管理する。"""

import asyncio
from dataclasses import dataclass, field


@dataclass
class _Subscriber:
    team_name: str
    queue: asyncio.Queue = field(default_factory=lambda: asyncio.Queue(maxsize=100))


_subscribers: list[_Subscriber] = []


def subscribe(team_name: str) -> asyncio.Queue:
    sub = _Subscriber(team_name=team_name)
    _subscribers.append(sub)
    return sub.queue


def unsubscribe(queue: asyncio.Queue) -> None:
    global _subscribers
    _subscribers = [s for s in _subscribers if s.queue is not queue]


async def broadcast(team_name: str, data: dict) -> None:
    dead: list[asyncio.Queue] = []
    for sub in list(_subscribers):
        if sub.team_name != team_name:
            continue
        try:
            sub.queue.put_nowait(data)
        except asyncio.QueueFull:
            dead.append(sub.queue)
    for q in dead:
        unsubscribe(q)
