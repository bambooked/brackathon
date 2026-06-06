"""Test database setup."""

import asyncio
import os
import sys
from contextlib import suppress
from pathlib import Path

import asyncpg
import pytest
from fastapi.testclient import TestClient
from tortoise import Tortoise
from tortoise.exceptions import ConfigurationError

BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = BACKEND_DIR.parent
INIT_SQL = REPO_DIR / "db" / "init.sql"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgres://postgres:password@localhost:5432/bt_test_db",
)
ADMIN_DATABASE_URL = os.getenv(
    "TEST_ADMIN_DATABASE_URL",
    "postgres://postgres:password@localhost:5432/postgres",
)

os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from main import app  # noqa: E402


def _database_name(database_url: str) -> str:
    return database_url.rsplit("/", maxsplit=1)[-1].split("?", maxsplit=1)[0]


async def _ensure_test_database() -> None:
    database_name = _database_name(TEST_DATABASE_URL)
    conn = await asyncpg.connect(ADMIN_DATABASE_URL)
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            database_name,
        )
        if exists is None:
            await conn.execute(f'CREATE DATABASE "{database_name}"')
    finally:
        await conn.close()


async def _reset_database() -> None:
    conn = await asyncpg.connect(TEST_DATABASE_URL)
    try:
        await conn.execute("DROP SCHEMA public CASCADE")
        await conn.execute("CREATE SCHEMA public")
        await conn.execute(INIT_SQL.read_text())
    finally:
        await conn.close()


@pytest.fixture(scope="session", autouse=True)
def test_database() -> None:
    asyncio.run(_ensure_test_database())
    yield


@pytest.fixture()
def client(test_database: None) -> TestClient:
    with suppress(ConfigurationError):
        asyncio.run(Tortoise.close_connections())
    asyncio.run(_reset_database())
    with TestClient(app) as test_client:
        yield test_client
