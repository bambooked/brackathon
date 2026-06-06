"""CRUD operations for DailyReport and Reaction models."""

from datetime import datetime, timezone


async def create_report(
    user_id: int, report_date: str, title: str | None, body: str
) -> dict:
    """日報を作成（モック）"""
    # AI判定のダミーロジック
    ai_points = 10 if len(body) > 50 else 5

    return {
        "id": 1,
        "user_id": user_id,
        "report_date": report_date,
        "title": title,
        "body": body,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "point_transaction_id": 101 if ai_points > 0 else None,
        "points_awarded": ai_points,
    }


async def get_reports_by_team(
    team_name: str,
    report_date: str | None = None,
    user_id: int | None = None,
) -> list[dict]:
    """チームの日報一覧を取得（モック）"""
    # モックデータ
    all_reports = [
        {
            "id": 1,
            "user_id": 1,
            "user": {
                "id": 1,
                "name": "テストユーザー",
                "email": "test@example.com",
                "role": "member",
                "team_name": "チームA",
            },
            "report_date": "2026-06-05",
            "title": "今日の開発進捗",
            "body": "バックエンドAPIの実装を進めました。認証周りとポイント機能を実装。",
            "reactions": [
                {
                    "id": 1,
                    "daily_report_id": 1,
                    "user_id": 2,
                    "type": "like",
                    "created_at": "2026-06-05T18:00:00Z",
                },
                {
                    "id": 2,
                    "daily_report_id": 1,
                    "user_id": 3,
                    "type": "thanks",
                    "created_at": "2026-06-05T19:00:00Z",
                },
            ],
            "created_at": "2026-06-05T17:30:00Z",
            "updated_at": "2026-06-05T17:30:00Z",
        },
        {
            "id": 2,
            "user_id": 2,
            "user": {
                "id": 2,
                "name": "山田太郎",
                "email": "yamada@example.com",
                "role": "member",
                "team_name": "チームA",
            },
            "report_date": "2026-06-05",
            "title": "フロントエンド実装",
            "body": "ダッシュボード画面のUIを実装しました。",
            "reactions": [],
            "created_at": "2026-06-05T17:00:00Z",
            "updated_at": "2026-06-05T17:00:00Z",
        },
        {
            "id": 3,
            "user_id": 1,
            "user": {
                "id": 1,
                "name": "テストユーザー",
                "email": "test@example.com",
                "role": "member",
                "team_name": "チームA",
            },
            "report_date": "2026-06-06",
            "title": "DB設計の進捗",
            "body": "テーブル設計を完了しました。",
            "reactions": [],
            "created_at": "2026-06-06T18:00:00Z",
            "updated_at": "2026-06-06T18:00:00Z",
        },
        {
            "id": 4,
            "user_id": 4,
            "user": {
                "id": 4,
                "name": "鈴木一郎",
                "email": "suzuki@example.com",
                "role": "member",
                "team_name": "チームB",
            },
            "report_date": "2026-06-06",
            "title": "チームBの日報",
            "body": "チームBの作業内容",
            "reactions": [],
            "created_at": "2026-06-06T18:00:00Z",
            "updated_at": "2026-06-06T18:00:00Z",
        },
    ]

    # チームでフィルタリング
    reports = [r for r in all_reports if r["user"]["team_name"] == team_name]

    # 追加フィルタリング
    if report_date is not None:
        reports = [r for r in reports if r["report_date"] == report_date]
    if user_id is not None:
        reports = [r for r in reports if r["user_id"] == user_id]

    return reports


async def update_report(
    report_id: int, title: str | None = None, body: str | None = None
) -> dict:
    """日報を更新（モック）"""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": report_id,
        "user_id": 1,
        "report_date": "2026-06-06",
        "title": title if title is not None else "更新された日報タイトル",
        "body": body if body is not None else "更新された日報本文",
        "created_at": "2026-06-06T10:00:00Z",
        "updated_at": now,
    }


async def create_reaction(
    report_id: int, user_id: int, reaction_type: str
) -> dict:
    """リアクションを作成（モック）"""
    return {
        "reaction": {
            "id": 10,
            "daily_report_id": report_id,
            "user_id": user_id,
            "type": reaction_type,
            "created_at": "2026-06-06T10:00:00Z",
        },
        "author_point_transaction": {
            "id": 201,
            "user_id": 2,  # 日報作成者（仮）
            "amount": 10,
            "transaction_type": "reaction_received",
            "created_at": "2026-06-06T10:00:00Z",
        },
        "reactor_point_transaction": {
            "id": 202,
            "user_id": user_id,
            "amount": 2,
            "transaction_type": "reaction_given",
            "created_at": "2026-06-06T10:00:00Z",
        },
        "my_new_balance": 120,
        "message": f"日報 {report_id} に {reaction_type} リアクションを送りました",
    }
