# CLAUDE.md

ブラックサンダーハッカソン「エンジニアが BT(ブラックサンダー) を食べたくなるアプリ」の **frontend**。
進捗管理に応じて BT(ポイント) を仲間に渡し合える Web アプリのUIを担当する。

## 担当範囲 (重要)

- **frontend のUIのみを実装する。** バックエンド接続は別担当(先輩)が行う。
- API 接続箇所は実装せず、`src/api/*` にモックのスタブを置き、`TODO(api)` と
  「先輩への受け渡しメモ」コメントを残す。
- フロント⇔バックの受け渡し型(DTO)は `src/types/index.ts` に集約し、これを接続の契約とする。

## 開発の進め方

- **TDD**（テスト → 実装 → リファクタ）で進める。新機能はテストを先に書く。
- テストは Vitest + Testing Library。**振る舞いベース**（ラベル/role で要素取得→操作→結果確認）で書く。
- API は `vi.mock` で固定し、ネットワーク遅延に依存しない。
- テストは対象と同じフォルダに co-location（例: `pages/LoginPage/LoginPage.test.tsx`）。

## 技術スタック

Vite 7 / React 18 / TypeScript / React Router 6 / Tailwind CSS 3 / Vitest 4。

## ディレクトリ構成 (ページ別)

```
src/
├── App.tsx              ルーティング (画面追加時はここに1行足す)
├── types/               受け渡し型 (DTO) ★接続契約
├── api/                 API スタブ (現在モック / 接続は先輩)
├── contexts/            AuthContext (ログイン状態)
├── components/          共通UI (Layout, BTMeter)
└── pages/               画面ごとに1フォルダ + 同フォルダに .test.tsx
```

新しい画面は `pages/XxxPage/XxxPage.tsx` と `XxxPage.test.tsx` を作り、`App.tsx` にルート追加。

## コマンド (すべて Docker 経由。ローカル npm は使わない)

リポジトリ直下で `docker compose up` して起動したまま、別ターミナルで実行する。

- 開発サーバー: `docker compose up`（`http://localhost:3000`）
- テスト1回: `docker compose exec frontend npm run test:run`
- テスト監視: `docker compose exec frontend npm test`
- 型チェック: `docker compose exec frontend npx tsc --noEmit`
- パッケージ追加: `docker compose exec frontend npm install <名前>`（後で `docker compose up --build`）

## セキュリティ方針

- Vitest は UI/API サーバー起点の脆弱性 (CVE-2025-24964 / CVE-2026-47429) があるため、
  `@vitest/ui` は導入しない。ヘッドレスの `vitest run` のみ。`npm audit` 0件を維持する。
