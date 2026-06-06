from fastapi import Depends, HTTPException, Header, status
from pydantic import BaseModel

from utils.auth import verify_access_token


class CurrentUser(BaseModel):
    """現在認証されているユーザー情報"""

    user_id: int
    email: str
    name: str
    team_name: str


async def get_current_user(authorization: str | None = Header(None)) -> CurrentUser:
    """
    認証依存関係 - JWTトークンを検証して現在のユーザーを取得

    Args:
        authorization: Authorizationヘッダー（Bearer {token}形式）

    Returns:
        CurrentUser: 認証されたユーザー情報

    Raises:
        HTTPException: 認証失敗時（401 Unauthorized）
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証が必要です",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # "Bearer {token}" 形式からトークンを抽出
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効な認証形式です",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1]

    # トークンを検証
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="無効なトークンです",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ペイロードから必要な情報を取得
    user_id = payload.get("user_id")
    email = payload.get("email")
    name = payload.get("name")
    team_name = payload.get("team_name")

    if user_id is None or email is None or name is None or team_name is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="トークンに必要な情報が含まれていません",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(user_id=user_id, email=email, name=name, team_name=team_name)


async def get_current_user_optional(authorization: str | None = Header(None)) -> CurrentUser | None:
    """
    オプショナルな認証依存関係 - トークンがあれば検証、なければNoneを返す

    Args:
        authorization: Authorizationヘッダー（Bearer {token}形式）

    Returns:
        CurrentUser | None: 認証されたユーザー情報、または None
    """
    if authorization is None:
        return None

    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None
