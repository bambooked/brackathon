from fastapi import APIRouter, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1/auth", tags=["認証"])


# リクエスト・レスポンスのスキーマ定義
class GoogleLoginRequest(BaseModel):
    id_token: str


class UserInfo(BaseModel):
    """users テーブルに対応するスキーマ"""
    id: int
    name: str
    email: str
    role: str  # member / admin
    created_at: str
    updated_at: str


class GoogleLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo


class CurrentUserResponse(BaseModel):
    """現在ログイン中のユーザー情報（users テーブル）"""
    id: int
    name: str
    email: str
    role: str  # member / admin
    created_at: str
    updated_at: str


@router.post("/google", response_model=GoogleLoginResponse)
async def google_login(request: GoogleLoginRequest):
    """
    Googleログイン - id_tokenを受け取り、アプリ専用のJWTトークンとユーザー情報を返す（モック）
    """
    # モックデータを返す
    return GoogleLoginResponse(
        access_token="mock_jwt_access_token_12345",
        user=UserInfo(
            id=1,
            name="テストユーザー",
            email="test@example.com",
            role="member",
            created_at="2026-01-01T00:00:00Z",
            updated_at="2026-06-06T00:00:00Z"
        )
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """
    現在ログイン中のユーザー情報を取得（モック・Dependency認証の雛形）
    """
    # 本来はauthorizationヘッダーからJWTを検証してユーザーを特定するが、
    # モックでは固定のダミーデータを返す
    return CurrentUserResponse(
        id=1,
        name="テストユーザー",
        email="test@example.com",
        role="member",
        created_at="2026-01-01T00:00:00Z",
        updated_at="2026-06-06T00:00:00Z"
    )
