"""Pydantic schemas for API requests and responses."""

from schemas.auth import (
    CurrentUserResponse,
    GoogleLoginRequest,
    GoogleLoginResponse,
    UpdateProfileRequest,
    UserInfo,
    UserListItem,
    UsersListResponse,
)
from schemas.point import (
    PointAccount,
    PointHistoryResponse,
    PointsStatusResponse,
    PointTransaction,
    PresentBTRequest,
    PresentBTResponse,
    TriggerEventResponse,
    UserPointSummary,
    UsersPointsResponse,
)
from schemas.report import (
    CreateReportRequest,
    CreateReportResponse,
    DailyReport,
    GetReportsResponse,
    AllReportsResponse,
    ReactToReportRequest,
    ReactToReportResponse,
    Reaction,
    ReportWithDetails,
    UpdateReportRequest,
    UserSummary,
)

__all__ = [
    # Auth schemas
    "GoogleLoginRequest",
    "GoogleLoginResponse",
    "UserInfo",
    "CurrentUserResponse",
    "UserListItem",
    "UsersListResponse",
    "UpdateProfileRequest",
    # Point schemas
    "PointTransaction",
    "PointAccount",
    "PresentBTRequest",
    "PresentBTResponse",
    "PointsStatusResponse",
    "PointHistoryResponse",
    "UserPointSummary",
    "UsersPointsResponse",
    "TriggerEventResponse",
    # Report schemas
    "DailyReport",
    "CreateReportRequest",
    "CreateReportResponse",
    "Reaction",
    "ReportWithDetails",
    "GetReportsResponse",
    "AllReportsResponse",
    "ReactToReportRequest",
    "ReactToReportResponse",
    "UpdateReportRequest",
    "UserSummary",
]
