from fastapi import APIRouter, Depends

import crud.report as report_crud
from schemas.report import (
    AllReportsResponse,
    CreateReportRequest,
    CreateReportResponse,
    DailyReport,
    GetReportsResponse,
    Reaction,
    ReactToReportRequest,
    ReactToReportResponse,
    ReportWithDetails,
    UpdateReportRequest,
    UserSummary,
)
from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/reports", tags=["日報・リアクション"])


@router.post("", response_model=CreateReportResponse)
async def create_report(
    request: CreateReportRequest, current_user: CurrentUser = Depends(get_current_user)
):
    """
    日報を投稿 - daily_reports に保存し、AI判定でポイント付与（モック）
    """
    result = await report_crud.create_report(
        user_id=current_user.user_id,
        report_date=request.report_date,
        title=request.title,
        body=request.body,
    )

    return CreateReportResponse(**result)


@router.get("/all", response_model=AllReportsResponse)
async def get_all_reports(current_user: CurrentUser = Depends(get_current_user)):
    """
    全期間全ユーザーの日報を取得（モック）
    - 統計情報（総件数、ユーザー数、期間）を含む
    - 同じチームの日報のみ返す
    """
    reports = await report_crud.get_reports_by_team(current_user.team_name)

    # 統計情報を計算
    user_ids = {r["user_id"] for r in reports}
    dates = sorted({r["report_date"] for r in reports})
    date_range = {"start": dates[0], "end": dates[-1]} if dates else {}

    return AllReportsResponse(
        reports=[
            ReportWithDetails(
                id=r["id"],
                user_id=r["user_id"],
                user=UserSummary(**r["user"]),
                report_date=r["report_date"],
                title=r["title"],
                body=r["body"],
                reactions=[Reaction(**reaction) for reaction in r["reactions"]],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            for r in reports
        ],
        total_count=len(reports),
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
    reports = await report_crud.get_reports_by_team(
        team_name=current_user.team_name,
        report_date=report_date,
        user_id=user_id,
    )

    return GetReportsResponse(
        reports=[
            ReportWithDetails(
                id=r["id"],
                user_id=r["user_id"],
                user=UserSummary(**r["user"]),
                report_date=r["report_date"],
                title=r["title"],
                body=r["body"],
                reactions=[Reaction(**reaction) for reaction in r["reactions"]],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
            for r in reports
        ]
    )


@router.patch("/{report_id}", response_model=DailyReport)
async def update_report(
    report_id: int,
    request: UpdateReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    日報を更新 - daily_reports の内容を更新（モック）
    当日分の日報のみ更新可能
    """
    result = await report_crud.update_report(
        report_id=report_id,
        title=request.title,
        body=request.body,
    )

    return DailyReport(**result)


@router.post("/{report_id}/react", response_model=ReactToReportResponse)
async def react_to_report(
    report_id: int,
    request: ReactToReportRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    日報にリアクション - reactions に保存し、双方に point_transactions を作成（モック）
    """
    result = await report_crud.create_reaction(
        report_id=report_id,
        user_id=current_user.user_id,
        reaction_type=request.type,
    )

    return ReactToReportResponse(
        reaction=Reaction(**result["reaction"]),
        author_point_transaction=result["author_point_transaction"],
        reactor_point_transaction=result["reactor_point_transaction"],
        my_new_balance=result["my_new_balance"],
        message=result["message"],
    )
