from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
def read_root():
    # Render環境かローカル環境かを判定する用のログ
    db_url = os.getenv("DATABASE_URL", "No DB URL found")
    return {"message": "Hello Black Thunder!", "db_status": "Connected to configuration"}