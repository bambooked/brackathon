from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel

from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/reports", tags=["日報・リアクション"])


# リクエスト・レスポンスのスキーマ定義


class UserSummary(BaseModel):
    """ユーザー情報のサマリー（JOIN結果）"""

    id: int
    name: str
    email: str
    role: str
    team_name: str


class Reaction(BaseModel):
    """reactions テーブルに対応するスキーマ"""

    id: int
    daily_report_id: int
    user_id: int
    type: str  # like / thanks / checked など
    created_at: str


class DailyReport(BaseModel):
    """daily_reports テーブルに対応するスキーマ"""

    id: int
    user_id: int
    report_date: str  # YYYY-MM-DD
    title: str | None = None
    body: str
    created_at: str
    updated_at: str


class CreateReportRequest(BaseModel):
    report_date: str  # YYYY-MM-DD
    title: str | None = None
    body: str


class UpdateReportRequest(BaseModel):
    """日報更新リクエスト"""

    title: str | None = None
    body: str | None = None


class CreateReportResponse(BaseModel):
    """日報作成後のレスポンス（daily_reports + point_transaction）"""

    id: int
    user_id: int
    report_date: str
    title: str | None = None
    body: str
    created_at: str
    point_transaction_id: int | None = None  # AI判定でポイントが付与された場合
    points_awarded: int


class ReportWithDetails(BaseModel):
    """日報とその詳細情報（JOIN結果）"""

    id: int
    user_id: int
    user: UserSummary  # users テーブルとJOIN
    report_date: str
    title: str | None = None
    body: str
    reactions: list[Reaction]  # reactions テーブルとJOIN
    created_at: str
    updated_at: str


class GetReportsResponse(BaseModel):
    reports: list[ReportWithDetails]


class AllReportsResponse(BaseModel):
    """全期間全ユーザーの日報取得レスポンス（統計情報含む）"""

    reports: list[ReportWithDetails]
    total_count: int
    user_count: int
    date_range: dict  # {"start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}


class ReactToReportRequest(BaseModel):
    type: str  # like / thanks / checked など


class ReactToReportResponse(BaseModel):
    """リアクション作成後のレスポンス（reactions + point_transactions）"""

    reaction: Reaction
    author_point_transaction: dict | None = None  # 日報作成者へのポイント付与
    reactor_point_transaction: dict | None = None  # リアクション者へのポイント付与
    my_new_balance: int  # リアクション実行者の更新後ポイント残高
    message: str


@router.post("", response_model=CreateReportResponse)
async def create_report(request: CreateReportRequest, authorization: str | None = Header(None)):
    """
    日報を投稿 - daily_reports に保存し、AI判定でポイント付与（モック）
    """
    # AI判定のダミーロジック（本来はAI APIを呼び出す）
    ai_points = 10 if len(request.body) > 50 else 5

    return CreateReportResponse(
        id=1,
        user_id=1,
        report_date=request.report_date,
        title=request.title,
        body=request.body,
        created_at="2026-06-06T10:00:00Z",
        point_transaction_id=101 if ai_points > 0 else None,
        points_awarded=ai_points,
    )


@router.get("/all", response_model=AllReportsResponse)
async def get_all_reports(current_user: CurrentUser = Depends(get_current_user)):
    """
    全期間全ユーザーの日報を取得（モック）
    - 統計情報（総件数、ユーザー数、期間）を含む
    - 同じチームの日報のみ返す
    """
    # モックデータとして複数日・複数ユーザー・複数チームの日報を用意
    all_mock_reports = [
        ReportWithDetails(
            id=1,
            user_id=1,
            user=UserSummary(
                id=1, name="テストユーザー", email="test@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-05",
            title="今日の開発進捗",
            body="バックエンドAPIの実装を進めました。認証周りとポイント機能を実装。",
            reactions=[
                Reaction(
                    id=1,
                    daily_report_id=1,
                    user_id=2,
                    type="like",
                    created_at="2026-06-05T18:00:00Z",
                ),
                Reaction(
                    id=2,
                    daily_report_id=1,
                    user_id=3,
                    type="thanks",
                    created_at="2026-06-05T19:00:00Z",
                ),
            ],
            created_at="2026-06-05T17:30:00Z",
            updated_at="2026-06-05T17:30:00Z",
        ),
        ReportWithDetails(
            id=2,
            user_id=2,
            user=UserSummary(
                id=2, name="山田太郎", email="yamada@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-05",
            title="フロントエンド実装",
            body="ダッシュボード画面のUIを実装しました。",
            reactions=[],
            created_at="2026-06-05T17:00:00Z",
            updated_at="2026-06-05T17:00:00Z",
        ),
        ReportWithDetails(
            id=3,
            user_id=1,
            user=UserSummary(
                id=1, name="テストユーザー", email="test@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-06",
            title="DB設計の進捗",
            body="テーブル設計を完了しました。",
            reactions=[],
            created_at="2026-06-06T18:00:00Z",
            updated_at="2026-06-06T18:00:00Z",
        ),
        ReportWithDetails(
            id=4,
            user_id=4,
            user=UserSummary(
                id=4, name="鈴木一郎", email="suzuki@example.com", role="member", team_name="チームB"
            ),
            report_date="2026-06-06",
            title="チームBの日報",
            body="チームBの作業内容",
            reactions=[],
            created_at="2026-06-06T18:00:00Z",
            updated_at="2026-06-06T18:00:00Z",
        ),
    ]

    # 同じチームの日報のみフィルタリング
    team_reports = [r for r in all_mock_reports if r.user.team_name == current_user.team_name]

    # 統計情報を計算
    user_ids = {r.user_id for r in team_reports}
    dates = sorted({r.report_date for r in team_reports})
    date_range = {"start": dates[0], "end": dates[-1]} if dates else {}

    return AllReportsResponse(
        reports=team_reports,
        total_count=len(team_reports),
        user_count=len(user_ids),
        date_range=date_range,
    )


@router.get("", response_model=GetReportsResponse)
async def get_reports(
    report_date: str | None = None,
    user_id: int | None = None,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    チームの日報一覧を取得（モック）
    - report_date: 日付で絞り込み (例: "2026-06-06")
    - user_id: 特定ユーザーで絞り込み
    - 同じチームの日報のみ返す
    """
    # モックデータとして複数日・複数ユーザー・複数チームの日報を用意
    all_mock_reports = [
        ReportWithDetails(
            id=1,
            user_id=1,
            user=UserSummary(
                id=1, name="テストユーザー", email="test@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-05",
            title="今日の開発進捗",
            body="バックエンドAPIの実装を進めました。認証周りとポイント機能を実装。",
            reactions=[
                Reaction(
                    id=1,
                    daily_report_id=1,
                    user_id=2,
                    type="like",
                    created_at="2026-06-05T18:00:00Z",
                ),
                Reaction(
                    id=2,
                    daily_report_id=1,
                    user_id=3,
                    type="thanks",
                    created_at="2026-06-05T19:00:00Z",
                ),
            ],
            created_at="2026-06-05T17:30:00Z",
            updated_at="2026-06-05T17:30:00Z",
        ),
        ReportWithDetails(
            id=2,
            user_id=2,
            user=UserSummary(
                id=2, name="山田太郎", email="yamada@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-05",
            title="フロントエンド実装",
            body="ダッシュボード画面のUIを実装しました。",
            reactions=[],
            created_at="2026-06-05T17:00:00Z",
            updated_at="2026-06-05T17:00:00Z",
        ),
        ReportWithDetails(
            id=3,
            user_id=1,
            user=UserSummary(
                id=1, name="テストユーザー", email="test@example.com", role="member", team_name="チームA"
            ),
            report_date="2026-06-06",
            title="DB設計の進捗",
            body="テーブル設計を完了しました。",
            reactions=[],
            created_at="2026-06-06T18:00:00Z",
            updated_at="2026-06-06T18:00:00Z",
        ),
        ReportWithDetails(
            id=4,
            user_id=4,
            user=UserSummary(
                id=4, name="鈴木一郎", email="suzuki@example.com", role="member", team_name="チームB"
            ),
            report_date="2026-06-06",
            title="チームBの日報",
            body="チームBの作業内容",
            reactions=[],
            created_at="2026-06-06T18:00:00Z",
            updated_at="2026-06-06T18:00:00Z",
        ),
    ]

    # 同じチームの日報のみフィルタリング
    filtered_reports = [r for r in all_mock_reports if r.user.team_name == current_user.team_name]

    # クエリパラメータでさらにフィルタリング
    if report_date is not None:
        filtered_reports = [r for r in filtered_reports if r.report_date == report_date]

    if user_id is not None:
        filtered_reports = [r for r in filtered_reports if r.user_id == user_id]

    return GetReportsResponse(reports=filtered_reports)


@router.patch("/{report_id}", response_model=DailyReport)
async def update_report(
    report_id: int, request: UpdateReportRequest, authorization: str | None = Header(None)
):
    """
    日報を更新 - daily_reports の内容を更新（モック）
    当日分の日報のみ更新可能
    """
    # モック実装: 実際はDBから取得して更新
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc).isoformat()

    # 更新データを作成
    updated_report = DailyReport(
        id=report_id,
        user_id=1,
        report_date="2026-06-06",
        title=request.title if request.title is not None else "更新された日報タイトル",
        body=request.body if request.body is not None else "更新された日報本文",
        created_at="2026-06-06T10:00:00Z",
        updated_at=now,
    )

    return updated_report


@router.post("/{report_id}/react", response_model=ReactToReportResponse)
async def react_to_report(
    report_id: int, request: ReactToReportRequest, authorization: str | None = Header(None)
):
    """
    日報にリアクション - reactions に保存し、双方に point_transactions を作成（モック）
    """
    reaction = Reaction(
        id=10,
        daily_report_id=report_id,
        user_id=1,  # リアクション送信者
        type=request.type,
        created_at="2026-06-06T10:00:00Z",
    )

    return ReactToReportResponse(
        reaction=reaction,
        author_point_transaction={
            "id": 201,
            "user_id": 2,  # 日報作成者（仮）
            "amount": 10,  # 日報作成者は10ポイント獲得
            "transaction_type": "reaction_received",
            "created_at": "2026-06-06T10:00:00Z",
        },
        reactor_point_transaction={
            "id": 202,
            "user_id": 1,  # リアクション送信者
            "amount": 2,  # リアクション者は2ポイント獲得
            "transaction_type": "reaction_given",
            "created_at": "2026-06-06T10:00:00Z",
        },
        my_new_balance=120,  # リアクション実行者の更新後残高（モック固定値）
        message=f"日報 {report_id} に {request.type} リアクションを送りました",
    )
