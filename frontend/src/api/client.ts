// ============================================================
// API クライアント基盤
// ------------------------------------------------------------
// 【先輩への受け渡しメモ】
// 実際の fetch 処理はここに集約します。現状は未接続のため、
// 各 api/*.ts はモックデータを返すスタブになっています。
// 接続時は下記 request() を本実装に差し替え、各スタブの
// TODO(api) コメント箇所を request() 呼び出しに置き換えてください。
//
// ベースURL は Vite の環境変数で切替を想定 (.env: VITE_API_BASE_URL)。
// 開発時は vite.config.ts の proxy 経由 ("/api") でも可。
// ============================================================

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * 共通 fetch ラッパ。
 * TODO(api): 認証トークンを Authorization ヘッダに載せる処理を追加。
 */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new ApiError(res.status, `API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}

/** スタブ用: ネットワーク遅延を模擬 */
export const mockDelay = (ms = 300) => new Promise((r) => setTimeout(r, ms))
