
## Local Postgres

ローカル開発では `db/Dockerfile` からPostgres 16を起動し、初回起動時に
`db/init.sql` がテーブルと開発用初期データを作成します。

```bash
docker-compose up -d db
docker-compose up backend
```

バックエンドは `DATABASE_URL` を参照します。Renderにデプロイする場合は、
RenderのPostgresで発行された接続文字列を `DATABASE_URL` に設定してください。
ローカルDBコンテナや `db/init.sql` はRender上の起動処理には使いません。
