// ============================================================
// 型定義 — フロント⇔バックエンドの受け渡し契約 (DTO)
// ------------------------------------------------------------
// 【先輩への受け渡しメモ】
// ここはフロントが想定している API レスポンス/リクエストの形です。
// FastAPI 側の Pydantic スキーマと食い違う場合は、ここを正として
// 合わせてもらうか、相談の上どちらかに寄せてください。
// 日付は ISO8601 文字列 (例: "2026-06-06T09:00:00+09:00") を想定。
// ============================================================

// ---- ユーザー / チーム ----
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  teamId: string
}

export interface Team {
  id: string
  name: string
  /** チームに貯まっている合計ポイント (フィーバー判定に使用) */
  totalPoints: number
}

// ---- ポイント ----
/** ポイント発生・消費の種別 */
export type PointReason =
  | 'report_reaction' // 日報リアクション
  | 'invisible_task' // 見えない業務の見える化 (AI判定)
  | 'present' // BTプレゼント消費
  | 'bt_time' // BTtime 開催消費
  | 'bt_fever' // BTfever 開催消費

export interface PointTransaction {
  id: string
  userId: string
  amount: number // 正=付与 / 負=消費
  reason: PointReason
  createdAt: string
}

/** ポイント消費イベントのコスト（バックエンドの実際値と一致させる） */
export const POINT_COST = {
  PRESENT: 10,
  BT_TIME: 50,
  BT_FEVER: 150,
} as const

// ---- 日報 ----
export interface Report {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
  reactions: Reaction[]
}

export interface Reaction {
  id: string
  userId: string
  emoji: string
}

export interface NewReportInput {
  content: string
  reportedAt?: string // datetime-local "YYYY-MM-DDThh:mm"
  title?: string
}

// ---- BTプレゼント ----
export interface Present {
  id: string
  fromUserId: string
  toUserId: string
  message?: string
  createdAt: string
}

// ---- イベント (BTtime / BTfever) ----
export type EventType = 'bt_time' | 'bt_fever'

export interface BTEvent {
  id: string
  type: EventType
  hostId: string
  startedAt: string
  endsAt: string
  active: boolean
}

// ---- 認証 ----
export interface LoginInput {
  teamId: string
  email: string
  password: string
}

export interface AuthResult {
  token: string
  user: User
}
