"""Break Thunder のスケジューリングと SSE ブロードキャストを管理する。"""

from datetime import UTC, datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

EVENT_DURATION_MINUTES = {"break_thunder": 15, "fever": 60}

scheduler = AsyncIOScheduler()


async def fire_break_thunder(schedule_id: int, team_name: str) -> None:
    """Break Thunder を発火: SSE をブロードキャストして DB を fired に更新する。"""
    from models import BreakThunderSchedule
    from sse.manager import manager

    ends_at = datetime.now(UTC) + timedelta(minutes=EVENT_DURATION_MINUTES["break_thunder"])
    await manager.broadcast(
        team_name,
        {
            "type": "break_thunder",
            "schedule_id": schedule_id,
            "ends_at": ends_at.isoformat(),
        },
    )
    await BreakThunderSchedule.filter(id=schedule_id).update(status="fired")


async def broadcast_bt_fever(team_name: str) -> None:
    """BTfever を即時ブロードキャストする。"""
    from sse.manager import manager

    ends_at = datetime.now(UTC) + timedelta(minutes=EVENT_DURATION_MINUTES["fever"])
    await manager.broadcast(
        team_name,
        {"type": "bt_fever", "ends_at": ends_at.isoformat()},
    )


async def restore_pending_schedules() -> None:
    """サーバー再起動時に pending のスケジュールを APScheduler に再登録する。"""
    from models import BreakThunderSchedule

    pending = await BreakThunderSchedule.filter(status="pending").all()
    now = datetime.now(UTC)
    for schedule in pending:
        if schedule.scheduled_at > now:
            scheduler.add_job(
                fire_break_thunder,
                "date",
                run_date=schedule.scheduled_at,
                args=[schedule.id, schedule.team_name],
                misfire_grace_time=60,
            )
        else:
            await fire_break_thunder(schedule.id, schedule.team_name)
