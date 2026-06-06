FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Viteなどの開発サーバー起動（ホストへのバインド用に --host を指定）
CMD ["npm", "run", "dev", "--", "--host"]