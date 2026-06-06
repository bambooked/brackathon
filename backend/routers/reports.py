from fastapi import APIRouter, Header
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/reports", tags=["日報・リアクション"])


# リクエスト・レスポンスのスキーマ定義


class UserSummary(BaseModel):
    """ユーザー情報のサマリー（JOIN結果）"""

    id: int
    name: str
    email: str
    role: str


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


class ReactToReportRequest(BaseModel):
    type: str  # like / thanks / checked など


class ReactToReportResponse(BaseModel):
    """リアクション作成後のレスポンス（reactions + point_transactions）"""

    reaction: Reaction
    author_point_transaction: dict | None = None  # 日報作成者へのポイント付与
    reactor_point_transaction: dict | None = None  # リアクション者へのポイント付与
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


@router.get("", response_model=GetReportsResponse)
async def get_reports(authorization: str | None = Header(None)):
    """
    チームの日報一覧を取得 - daily_reports + reactions + users を JOIN（モック）
    """
    # モックデータとして2件の日報を返す
    mock_reports = [
        ReportWithDetails(
            id=1,
            user_id=1,
            user=UserSummary(id=1, name="テストユーザー", email="test@example.com", role="member"),
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
            user=UserSummary(id=2, name="山田太郎", email="yamada@example.com", role="member"),
            report_date="2026-06-05",
            title="フロントエンド実装",
            body="ダッシュボード画面のUIを実装しました。",
            reactions=[],
            created_at="2026-06-05T17:00:00Z",
            updated_at="2026-06-05T17:00:00Z",
        ),
    ]

    return GetReportsResponse(reports=mock_reports)


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
            "amount": 3,
            "transaction_type": "reaction_received",
            "created_at": "2026-06-06T10:00:00Z",
        },
        reactor_point_transaction={
            "id": 202,
            "user_id": 1,  # リアクション送信者
            "amount": 1,
            "transaction_type": "reaction_given",
            "created_at": "2026-06-06T10:00:00Z",
        },
        message=f"日報 {report_id} に {request.type} リアクションを送りました",
    )
