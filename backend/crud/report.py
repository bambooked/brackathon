"""CRUD operations for DailyReport and Reaction models."""

from datetime import date

from tortoise.exceptions import IntegrityError
from tortoise.expressions import F
from tortoise.transactions import in_transaction

from models import DailyReport, PointAccount, PointTransaction, Reaction, User


def _user_to_summary(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "team_name": user.team_name,
    }


def _report_to_dict(report: DailyReport) -> dict:
    return {
        "id": report.id,
        "user_id": report.user_id,
        "user": _user_to_summary(report.user),
        "report_date": report.report_date.isoformat(),
        "title": report.title,
        "body": report.body,
        "reactions": [_reaction_to_dict(reaction) for reaction in report.reactions],
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }


def _reaction_to_dict(reaction: Reaction) -> dict:
    return {
        "id": reaction.id,
        "daily_report_id": reaction.daily_report_id,
        "user_id": reaction.user_id,
        "type": reaction.type,
        "created_at": reaction.created_at.isoformat(),
    }


def _transaction_to_dict(transaction: PointTransaction) -> dict:
    return {
        "id": transaction.id,
        "user_id": transaction.user_id,
        "amount": transaction.amount,
        "transaction_type": transaction.transaction_type,
        "source_type": transaction.source_type,
        "source_id": transaction.source_id,
        "description": transaction.description,
        "created_at": transaction.created_at.isoformat(),
    }


async def _ensure_user(user_id: int) -> User:
    user, _ = await User.get_or_create(
        id=user_id,
        defaults={
            "email": f"user{user_id}@local.invalid",
            "name": f"User {user_id}",
            "team_name": "チームA",
        },
    )
    return user


async def _get_or_create_account(user_id: int) -> PointAccount:
    user = await _ensure_user(user_id)
    account, _ = await PointAccount.get_or_create(user=user, defaults={"balance": 100})
    return account


async def _apply_points(
    user_id: int,
    amount: int,
    transaction_type: str,
    source_type: str | None = None,
    source_id: int | None = None,
    description: str | None = None,
) -> tuple[PointTransaction, PointAccount]:
    account = await _get_or_create_account(user_id)
    account.balance = F("balance") + amount
    await account.save(update_fields=["balance", "updated_at"])
    await account.refresh_from_db()

    transaction = await PointTransaction.create(
        user_id=user_id,
        amount=amount,
        transaction_type=transaction_type,
        source_type=source_type,
        source_id=source_id,
        description=description,
    )
    return transaction, account


async def create_report(
    user_id: int, report_date: str, title: str | None, body: str
) -> dict:
    """日報を作成"""
    user = await _ensure_user(user_id)
    report_day = date.fromisoformat(report_date)

    # AI判定のダミーロジック。DBモックではないため判断待ちとして残す。
    ai_points = 10 if len(body) > 50 else 5

    async with in_transaction():
        report = await DailyReport.create(
            user=user,
            report_date=report_day,
            title=title,
            body=body,
        )
        transaction = None
        if ai_points > 0:
            transaction, _ = await _apply_points(
                user_id=user_id,
                amount=ai_points,
                transaction_type="ai_evaluation",
                source_type="ai_evaluation",
                source_id=report.id,
                description="日報のAI評価でポイント獲得",
            )

    return {
        "id": report.id,
        "user_id": report.user_id,
        "report_date": report.report_date.isoformat(),
        "title": report.title,
        "body": report.body,
        "created_at": report.created_at.isoformat(),
        "point_transaction_id": transaction.id if transaction is not None else None,
        "points_awarded": ai_points,
    }


async def get_reports_by_team(
    team_name: str,
    report_date: str | None = None,
    user_id: int | None = None,
) -> list[dict]:
    """チームの日報一覧を取得"""
    query = DailyReport.filter(user__team_name=team_name)
    if report_date is not None:
        query = query.filter(report_date=date.fromisoformat(report_date))
    if user_id is not None:
        query = query.filter(user_id=user_id)

    reports = await query.select_related("user").prefetch_related("reactions")
    return [_report_to_dict(report) for report in reports]


async def update_report(
    report_id: int, title: str | None = None, body: str | None = None
) -> dict:
    """日報を更新"""
    report = await DailyReport.get(id=report_id).select_related("user")

    if title is not None:
        report.title = title
    if body is not None:
        report.body = body

    await report.save()
    await report.fetch_related("reactions")

    return {
        "id": report.id,
        "user_id": report.user_id,
        "report_date": report.report_date.isoformat(),
        "title": report.title,
        "body": report.body,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }


async def create_reaction(
    report_id: int, user_id: int, reaction_type: str
) -> dict:
    """リアクションを作成"""
    report = await DailyReport.get(id=report_id).select_related("user")
    await _ensure_user(user_id)

    async with in_transaction():
        try:
            reaction = await Reaction.create(
                daily_report_id=report_id,
                user_id=user_id,
                type=reaction_type,
            )
            created = True
        except IntegrityError:
            reaction = await Reaction.get(
                daily_report_id=report_id,
                user_id=user_id,
                type=reaction_type,
            )
            created = False

        author_transaction = None
        reactor_transaction = None
        if created:
            author_transaction, _ = await _apply_points(
                user_id=report.user_id,
                amount=10,
                transaction_type="reaction_received",
                source_type="reaction",
                source_id=reaction.id,
                description="日報にリアクションをもらった",
            )
            reactor_transaction, account = await _apply_points(
                user_id=user_id,
                amount=2,
                transaction_type="reaction_given",
                source_type="reaction",
                source_id=reaction.id,
                description="日報にリアクションした",
            )
        else:
            account = await _get_or_create_account(user_id)

    return {
        "reaction": _reaction_to_dict(reaction),
        "author_point_transaction": (
            _transaction_to_dict(author_transaction)
            if author_transaction is not None
            else None
        ),
        "reactor_point_transaction": (
            _transaction_to_dict(reactor_transaction)
            if reactor_transaction is not None
            else None
        ),
        "my_new_balance": account.balance,
        "message": f"日報 {report_id} に {reaction_type} リアクションを送りました",
    }
