import os
from datetime import datetime, timedelta, timezone

from google.auth.transport import requests
from google.oauth2 import id_token
from jose import JWTError, jwt

# 環境変数から設定を読み込み
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_secret_key_change_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def verify_google_token(token: str) -> dict | None:
    """
    Google ID Tokenを検証し、ペイロードを返す

    Args:
        token: Google ID Token

    Returns:
        検証成功時はペイロード（dict）、失敗時はNone
    """
    try:
        # Google ID Tokenを検証
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)

        # issが正しいか確認
        if idinfo["iss"] not in ["accounts.google.com", "https://accounts.google.com"]:
            return None

        return idinfo
    except ValueError:
        # 検証失敗
        return None


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    JWT Access Tokenを生成

    Args:
        data: トークンに含めるデータ（user_id, emailなど）
        expires_delta: 有効期限（指定しない場合はデフォルト値を使用）

    Returns:
        JWT Access Token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return encoded_jwt


def verify_access_token(token: str) -> dict | None:
    """
    JWT Access Tokenを検証し、ペイロードを返す

    Args:
        token: JWT Access Token

    Returns:
        検証成功時はペイロード（dict）、失敗時はNone
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None
