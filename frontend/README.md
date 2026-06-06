# BT Frontend ⚡

ブラックサンダーハッカソン「エンジニアがBTを食べたくなるアプリ」のフロントエンド。

進捗管理に応じて BT(ポイント) を仲間に渡し合えるWebアプリのUIを担当します。
**このリポジトリのフロントは UI のみを実装し、API 接続は接続担当(先輩)に引き継ぐ方針**です。
接続箇所には `TODO(api)` と「先輩への受け渡しメモ」コメントを残しています。

## 技術スタック

| 種別 | 採用技術 |
| --- | --- |
| ビルド | Vite 7 |
| 言語 | TypeScript |
| UI | React 18 + React Router 6 |
| スタイル | Tailwind CSS 3 |
| テスト | Vitest 4 + Testing Library (TDD) |

## セットアップ

```bash
cd frontend
npm install
npm run dev      # 開発サーバー (http://localhost:3000)
```

Docker を使う場合はリポジトリ直下で `docker compose up` 。

## スクリプト

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm test` | テストを watch モードで実行 |
| `npm run test:run` | テストを1回だけ実行 (CI 向け) |

## ディレクトリ構成 (ページ別)

```
src/
├── main.tsx              エントリ (Router / AuthProvider をマウント)
├── App.tsx               ルーティング定義
├── index.css            Tailwind 読み込み
├── types/               フロント⇔バックの受け渡し型 (DTO) ★接続契約
├── api/                 API 呼び出し (現在モック)。接続担当が実装
│   ├── client.ts        fetch 基盤
│   ├── auth.ts          ログイン
│   ├── reports.ts       日報・リアクション
│   └── points.ts        ポイント・プレゼント・イベント
├── contexts/
│   └── AuthContext.tsx  ログイン状態の共有
├── components/          ページ横断の共通UI
│   ├── Layout/          ヘッダ + 共通レイアウト
│   └── BTMeter/         BTメーター(進捗ゲージ) + テスト
└── pages/               ★画面ごとに1フォルダ
    ├── LoginPage/        ログイン (TDDの見本: .test.tsx あり)
    ├── DashboardPage/    保有PT + BTメーター
    ├── ReportsPage/      日報一覧・投稿・リアクション
    ├── PresentPage/      BTプレゼント
    └── EventsPage/       BTtime / BTfever
```

ページを追加するときは `pages/XxxPage/XxxPage.tsx` と `XxxPage.test.tsx` を作り、
`App.tsx` にルートを1行足します。

## TDD の進め方

1. **Red**: 先に `*.test.tsx` を書く (まだ動かないので失敗する)
2. **Green**: テストが通る最小限の実装を書く
3. **Refactor**: テストを保ったまま整理する

見本は `pages/LoginPage/LoginPage.test.tsx` と `components/BTMeter/BTMeter.test.tsx`。
テストは画面の「振る舞い」(ラベルで要素を取得し、操作し、結果を確認) を書きます。

## 接続担当(先輩)への引き継ぎメモ

- フロントが想定する API の形は `src/types/index.ts` にまとめています。これを契約の基準にしてください。
- 各 `api/*.ts` はモックを返すスタブです。`TODO(api)` 行を本物の `request()` 呼び出しに置き換えると接続できます。
- ベースURL は環境変数 `VITE_API_BASE_URL` で切替。開発時は `vite.config.ts` の proxy(`/api`) を有効化すると CORS を回避できます。
- 認証トークンの保存方法 (Cookie / Storage) は未確定です。`AuthContext.tsx` / `client.ts` を相談の上で実装してください。


## セキュリティについて (Vitest の脆弱性対応)

Vitest には UI/API サーバー経由の重大な脆弱性が複数報告されています
(CVE-2025-24964, CVE-2026-47429 など)。本プロジェクトでは:

- 修正版の **Vitest 4.1.x** を使用 (`npm audit` で 0 件)
- ぜい弱性の起点になる **Vitest UI (`@vitest/ui`) は導入しない**。テストはヘッドレスの `vitest run` のみ

`npm install` 後に `npm audit` で脆弱性ゼロを確認できます。
依存を追加した際は `npm audit` を実行してください。