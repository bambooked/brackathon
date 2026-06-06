FROM node:20-alpine

WORKDIR /app

# package.json と lock ファイルを先にコピーし、依存を固定インストール
# (npm ci は package-lock.json に完全一致でインストール → 再現性が高い)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Viteなどの開発サーバー起動（ホストへのバインド用に --host を指定）
CMD ["npm", "run", "dev", "--", "--host"]
