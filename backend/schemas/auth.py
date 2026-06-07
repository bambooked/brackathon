"""Authentication related Pydantic schemas."""

from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    id_token: str
    team_name: str | None = None


class UserInfo(BaseModel):
    """users テーブルに対応するスキーマ"""

    id: int
    name: str
    email: str
    role: str  # member / admin
    team_name: str  # 所属グループ名
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
    team_name: str  # 所属グループ名
    created_at: str
    updated_at: str


class UserListItem(BaseModel):
    """ユーザーリストアイテム（BT送付先選択用）"""

    id: int
    name: str
    nickname: str | None = None
    use_nickname: bool = False
    team_name: str  # 所属グループ名


class UsersListResponse(BaseModel):
    """ユーザー一覧レスポンス"""

    users: list[UserListItem]


class UpdateProfileRequest(BaseModel):
    """プロフィール更新リクエスト"""

    name: str | None = None
    nickname: str | None = None
    use_nickname: bool | None = None
