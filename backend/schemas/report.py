"""Report related Pydantic schemas."""

from pydantic import BaseModel


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
    """日報作成後のレスポンス（ReportWithDetails + point情報）"""

    id: int
    user_id: int
    user: UserSummary
    report_date: str
    title: str | None = None
    body: str
    reactions: list[Reaction]
    created_at: str
    updated_at: str
    point_transaction_id: int | None = None
    points_awarded: int = 0


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
