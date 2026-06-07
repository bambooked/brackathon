import os
from dotenv import load_dotenv

# 他のモジュールが os.getenv() を module-level で呼ぶ前にロードする
load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db.config import close_db, init_db
from routers import auth, points, reports
from routers.break_thunder import router as break_thunder_router
from routers.events import router as events_router
from scheduler import restore_pending_schedules, scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    await init_db()
    scheduler.start()
    await restore_pending_schedules()
    print("✅ Tortoise-ORM initialized / Scheduler started")
    yield
    scheduler.shutdown(wait=False)
    await close_db()
    print("✅ Scheduler stopped / Tortoise-ORM connections closed")


app = FastAPI(
    title="ブラックサンダーハッカソンAPI",
    description="対面コミュニケーションを活性化させるBTハッカソンアプリのバックエンドAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS設定 - フロントエンド（port 3000）からのアクセスを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
        "*",  # 開発環境用。本番では適切なオリジンを指定
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(auth.router)
app.include_router(points.router)
app.include_router(reports.router)
app.include_router(events_router)
app.include_router(break_thunder_router)


@app.get("/")
def read_root():
    os.getenv("DATABASE_URL", "No DB URL found")
    return {"message": "Hello Black Thunder!", "db_status": "Connected to configuration"}


@app.get("/health")
def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "service": "BT Hackathon API"}
