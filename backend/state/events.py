"""BTtime / BTfever のアクティブ状態をインメモリで管理する。

サーバー再起動でリセットされるがプロトタイプ用途では十分。
チームごとに1件だけ保持し、終了時刻を過ぎたら自動で消去する。
"""

from datetime import UTC, datetime, timedelta

EVENT_DURATION_MINUTES = {
    "time": 30,
    "fever": 60,
}

_active_events: dict[str, dict] = {}


def set_event(team_name: str, event_type: str) -> dict:
    duration = EVENT_DURATION_MINUTES.get(event_type, 30)
    now = datetime.now(UTC)
    ends_at = now + timedelta(minutes=duration)
    event = {
        "event_type": event_type,
        "started_at": now.isoformat(),
        "ends_at": ends_at.isoformat(),
        "active": True,
    }
    _active_events[team_name] = event
    return event


def get_event(team_name: str) -> dict | None:
    event = _active_events.get(team_name)
    if event is None:
        return None
    ends_at = datetime.fromisoformat(event["ends_at"])
    if datetime.now(UTC) > ends_at:
        del _active_events[team_name]
        return None
    return event
