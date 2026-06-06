// ============================================================
// 日報 API スタブ
// 【先輩への受け渡しメモ】
//   - fetchReports: GET  /reports
//   - createReport: POST /reports        (NewReportInput -> Report)
//   - addReaction : POST /reports/:id/reactions  ({emoji} -> Reaction)
//     ※ リアクション時は自分と相手の双方にポイント付与 (バック側で処理想定)
// ============================================================
import type { NewReportInput, Reaction, Report } from '@/types'
import { mockDelay } from './client'

const mockReports: Report[] = [
  {
    id: 'r-001',
    authorId: 'u-002',
    authorName: 'ユーザーA',
    content: 'スライド作成完了しました！',
    createdAt: '2026-06-06T09:00:00+09:00',
    reactions: [{ id: 'rx-1', userId: 'u-001', emoji: '⚡' }],
  },
]

export async function fetchReports(): Promise<Report[]> {
  // TODO(api): return request<Report[]>('/reports')
  await mockDelay()
  return mockReports
}

export async function createReport(input: NewReportInput): Promise<Report> {
  // TODO(api): return request<Report>('/reports', { method: 'POST', body: JSON.stringify(input) })
  await mockDelay()
  return {
    id: `r-${Date.now()}`,
    authorId: 'u-001',
    authorName: 'テスト太郎',
    content: input.content,
    createdAt: new Date().toISOString(),
    reactions: [],
  }
}

export async function addReaction(reportId: string, emoji: string): Promise<Reaction> {
  // TODO(api): return request<Reaction>(`/reports/${reportId}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) })
  await mockDelay(150)
  void reportId // スタブのため未使用 (接続時に上記 request で使用)
  return { id: `rx-${Date.now()}`, userId: 'u-001', emoji }
}
