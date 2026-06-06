import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, points, reports

# 環境変数を読み込み（.envファイルが存在する場合）
load_dotenv()

app = FastAPI(
    title="ブラックサンダーハッカソンAPI",
    description="対面コミュニケーションを活性化させるBTハッカソンアプリのバックエンドAPI",
    version="1.0.0",
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


@app.get("/")
def read_root():
    # Render環境かローカル環境かを判定する用のログ
    os.getenv("DATABASE_URL", "No DB URL found")
    return {"message": "Hello Black Thunder!", "db_status": "Connected to configuration"}


@app.get("/health")
def health_check():
    """ヘルスチェックエンドポイント"""
    return {"status": "ok", "service": "BT Hackathon API"}
