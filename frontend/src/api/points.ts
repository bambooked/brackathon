// ============================================================
// ポイント / プレゼント / イベント API スタブ
// 【先輩への受け渡しメモ】
//   - fetchMyPoints : GET  /points/me        -> number (保有PT)
//   - fetchTeamPoints: GET /teams/:id/points -> number (チーム合計, BTメーター用)
//   - sendPresent   : POST /presents         (Present)
//   - startEvent    : POST /events           (type -> BTEvent)
// ============================================================
import type { BTEvent, EventType, Present } from '@/types'

import { mockDelay } from './client'

export async function fetchMyPoints(): Promise<number> {
  // TODO(api): return request<number>('/points/me')
  await mockDelay()
  return 12
}

export async function fetchTeamPoints(teamId: string): Promise<number> {
  // TODO(api): return request<number>(`/teams/${teamId}/points`)
  await mockDelay()
  void teamId
  return 80
}

export async function sendPresent(toUserId: string, message?: string): Promise<Present> {
  // TODO(api): return request<Present>('/presents', { method: 'POST', body: JSON.stringify({ toUserId, message }) })
  await mockDelay()
  return {
    id: `p-${Date.now()}`,
    fromUserId: 'u-001',
    toUserId,
    message,
    createdAt: new Date().toISOString(),
  }
}

export async function startEvent(type: EventType): Promise<BTEvent> {
  // TODO(api): return request<BTEvent>('/events', { method: 'POST', body: JSON.stringify({ type }) })
  await mockDelay()
  const now = new Date()
  return {
    id: `e-${Date.now()}`,
    type,
    hostId: 'u-001',
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
    active: true,
  }
}
