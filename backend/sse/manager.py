"""チーム別 SSE 接続を管理するシングルトン。"""

import asyncio
from collections import defaultdict


class ConnectionManager:
    def __init__(self) -> None:
        self._clients: dict[str, list[asyncio.Queue]] = defaultdict(list)

    def add(self, team_name: str, q: asyncio.Queue) -> None:
        self._clients[team_name].append(q)

    def remove(self, team_name: str, q: asyncio.Queue) -> None:
        try:
            self._clients[team_name].remove(q)
        except ValueError:
            pass

    async def broadcast(self, team_name: str, data: dict) -> None:
        for q in list(self._clients.get(team_name, [])):
            await q.put(data)


manager = ConnectionManager()
