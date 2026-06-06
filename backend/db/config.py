"""Tortoise-ORM configuration."""

import os
from typing import Any

from tortoise import Tortoise

# 環境変数からDB接続情報を取得
# Tortoise-ORM with asyncpg requires "postgres://" scheme
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgres://postgres:postgres@db:5432/brackathon",
)

# Tortoise-ORM設定
TORTOISE_ORM: dict[str, Any] = {
    "connections": {
        "default": DATABASE_URL,
    },
    "apps": {
        "models": {
            "models": ["models", "aerich.models"],
            "default_connection": "default",
        },
    },
    "use_tz": True,
    "timezone": "UTC",
}


async def init_db() -> None:
    """Tortoise-ORMを初期化"""
    await Tortoise.init(config=TORTOISE_ORM)
    # マイグレーションは Aerich で管理するため、generate_schemas は使用しない
    # await Tortoise.generate_schemas()


async def close_db() -> None:
    """Tortoise-ORMのコネクションをクローズ"""
    await Tortoise.close_connections()
