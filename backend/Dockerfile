FROM python:3.11-slim

WORKDIR /app

# 先に依存関係をコピーしてキャッシュを利用
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 修正：--port を 8000 に変更
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]