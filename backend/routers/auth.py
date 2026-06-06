from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from utils.auth import create_access_token, verify_google_token
from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["認証"])

# インメモリのユーザーストア（実際のDB統合前の一時的な実装）
# 本来はDBから取得・保存するが、今は認証フローの動作確認のためメモリに保存
users_store: dict[str, dict] = {}
user_id_counter = 1


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
    Googleログイン - Google ID Tokenを検証し、アプリ専用のJWTトークンとユーザー情報を返す

    1. Google ID Tokenを検証
    2. ユーザー情報を取得（新規ユーザーの場合は作成）
    3. JWT Access Tokenを生成して返す
    """
    global user_id_counter

    # Google ID Tokenを検証
    id_info = verify_google_token(request.id_token)
    if id_info is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なGoogle ID Tokenです",
        )

    # Google IDから情報を取得
    email = id_info.get("email")
    name = id_info.get("name", email)  # nameがない場合はemailを使用

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="メールアドレスが取得できませんでした",
        )

    # ユーザーをメモリストアから取得または新規作成
    now = datetime.now(timezone.utc).isoformat()

    if email in users_store:
        # 既存ユーザー
        user = users_store[email]
        user["updated_at"] = now
    else:
        # 新規ユーザー
        user = {
            "id": user_id_counter,
            "email": email,
            "name": name,
            "role": "member",
            "created_at": now,
            "updated_at": now,
        }
        users_store[email] = user
        user_id_counter += 1

    # JWT Access Tokenを生成
    access_token = create_access_token(
        data={"user_id": user["id"], "email": user["email"], "name": user["name"]}
    )

    return GoogleLoginResponse(
        access_token=access_token,
        user=UserInfo(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
            updated_at=user["updated_at"],
        ),
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(current_user: CurrentUser = Depends(get_current_user)):
    """
    現在ログイン中のユーザー情報を取得

    JWT Access Tokenから認証情報を取得し、ユーザー情報を返す
    """
    # メモリストアからユーザー情報を取得
    user = users_store.get(current_user.email)

    if user is None:
        # ストアにない場合は、トークンの情報から最小限のユーザー情報を返す
        # （通常は発生しないが、サーバー再起動などで発生する可能性がある）
        now = datetime.now(timezone.utc).isoformat()
        return CurrentUserResponse(
            id=current_user.user_id,
            name=current_user.name,
            email=current_user.email,
            role="member",
            created_at=now,
            updated_at=now,
        )

    return CurrentUserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    )
