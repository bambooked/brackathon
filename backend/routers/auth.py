from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

import crud.user as user_crud
from schemas.auth import (
    CurrentUserResponse,
    GoogleLoginRequest,
    GoogleLoginResponse,
    UpdateProfileRequest,
    UserInfo,
    UserListItem,
    UsersListResponse,
)
from utils.auth import GOOGLE_CLIENT_ID, create_access_token, verify_google_token
from utils.dependencies import CurrentUser, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["認証"])
CURRENT_USER_DEP = Depends(get_current_user)


@router.post("/google", response_model=GoogleLoginResponse)
async def google_login(request: GoogleLoginRequest):
    """
    Googleログイン - Google ID Tokenを検証し、アプリ専用のJWTトークンとユーザー情報を返す

    1. Google ID Tokenを検証
    2. ユーザー情報を取得（新規ユーザーの場合は作成）
    3. JWT Access Tokenを生成して返す
    """
    # Google ID Tokenを検証
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_IDが設定されていません",
        )

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

    team_name = request.team_name.strip() if request.team_name else "チームA"
    if not team_name:
        team_name = "チームA"

    # ユーザーを取得または新規作成
    user = await user_crud.get_user_by_email(email)
    if user is None:
        user = await user_crud.create_user(email=email, name=name, team_name=team_name)
    else:
        # プロトタイプ用: ログイン時の選択チームへ所属を切り替える
        user = await user_crud.update_user(
            email=email,
            team_name=team_name,
            updated_at=datetime.now(UTC).isoformat(),
        )

    # JWT Access Tokenを生成
    access_token = create_access_token(
        data={
            "user_id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "team_name": user["team_name"],
        }
    )

    return GoogleLoginResponse(
        access_token=access_token,
        user=UserInfo(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            team_name=user["team_name"],
            created_at=user["created_at"],
            updated_at=user["updated_at"],
        ),
    )


@router.get("/me", response_model=CurrentUserResponse)
async def get_current_user_info(current_user: CurrentUser = CURRENT_USER_DEP):
    """
    現在ログイン中のユーザー情報を取得

    JWT Access Tokenから認証情報を取得し、ユーザー情報を返す
    """
    # ユーザー情報を取得
    user = await user_crud.get_user_by_email(current_user.email)

    if user is None:
        # ストアにない場合は、トークンの情報から最小限のユーザー情報を返す
        now = datetime.now(UTC).isoformat()
        return CurrentUserResponse(
            id=current_user.user_id,
            name=current_user.name,
            email=current_user.email,
            role="member",
            team_name=current_user.team_name,
            created_at=now,
            updated_at=now,
        )

    return CurrentUserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        team_name=user["team_name"],
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    )


@router.get("/users", response_model=UsersListResponse)
async def get_users_list(current_user: CurrentUser = CURRENT_USER_DEP):
    """
    ユーザー一覧を取得
    - BT送付先選択で使用
    - 同じチームのメンバーのみ返す
    """
    users = await user_crud.get_users_by_team(current_user.team_name)

    return UsersListResponse(
        users=[
            UserListItem(
                id=u["id"],
                name=u["name"],
                nickname=u.get("nickname"),
                use_nickname=u.get("use_nickname", False),
                team_name=u["team_name"],
            )
            for u in users
        ]
    )


@router.patch("/profile", response_model=CurrentUserResponse)
async def update_profile(
    request: UpdateProfileRequest, current_user: CurrentUser = CURRENT_USER_DEP
):
    """
    プロフィールを更新
    - 名前、ニックネーム、ニックネーム表示設定を更新
    """
    # ユーザー情報を更新
    update_data = {}
    if request.name is not None:
        update_data["name"] = request.name
    if request.nickname is not None:
        update_data["nickname"] = request.nickname
    if request.use_nickname is not None:
        update_data["use_nickname"] = request.use_nickname

    user = await user_crud.update_user(current_user.email, **update_data)

    return CurrentUserResponse(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        team_name=user["team_name"],
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    )
