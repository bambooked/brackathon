"""Break Thunder掲示板のインメモリ状態管理（チームごとに分離）。"""

from datetime import UTC, datetime

# team_name -> {"session_id": int, "messages": list, "msg_counter": int}
_sessions: dict[str, dict] = {}


def start_session(team_name: str) -> int:
    session = _sessions.setdefault(team_name, {"session_id": 0, "messages": [], "msg_counter": 0})
    session["session_id"] += 1
    session["messages"] = []
    session["msg_counter"] = 0
    return session["session_id"]


def get_session_id(team_name: str) -> int:
    return _sessions.get(team_name, {}).get("session_id", 0)


def add_message(team_name: str, user_id: int, user_name: str, body: str) -> dict:
    session = _sessions.setdefault(team_name, {"session_id": 0, "messages": [], "msg_counter": 0})
    session["msg_counter"] += 1
    msg = {
        "id": session["msg_counter"],
        "schedule_id": session["session_id"],
        "user_id": user_id,
        "user_name": user_name,
        "body": body,
        "created_at": datetime.now(UTC).isoformat(),
    }
    session["messages"].append(msg)
    return msg


def get_messages(team_name: str) -> list[dict]:
    return list(_sessions.get(team_name, {}).get("messages", []))
