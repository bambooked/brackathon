import type { BTEvent, EventType, PointTransaction, Present } from '@/types'

import { request } from './client'

// バックエンドのレスポンス型
interface BackendTransaction {
  id: number
  user_id: number
  amount: number
  transaction_type: string
  source_type: string | null
  source_id: number | null
  description: string | null
  created_at: string
}

interface TriggerEventBackendResponse {
  message: string
  event_type: string
  points_consumed: number
  transaction: BackendTransaction
  user_balance: number
  scheduled_at: string | null
}

export async function fetchMyPoints(): Promise<number> {
  const res = await request<{ balance: number; created_at: string; updated_at: string }>('/points/status')
  return res.balance
}

export async function fetchPointHistory(): Promise<PointTransaction[]> {
  const res = await request<{ transactions: BackendTransaction[]; total_earned: number; total_spent: number }>(
    '/points/history',
  )
  return res.transactions.map((tx) => ({
    id: String(tx.id),
    userId: String(tx.user_id),
    amount: tx.amount,
    reason: tx.transaction_type as PointTransaction['reason'],
    createdAt: tx.created_at,
  }))
}

export async function sendPresent(toUserId: string, _message?: string): Promise<Present> {
  const res = await request<{ message: string; sender_transaction: BackendTransaction; sender_balance: number }>(
    '/points/present',
    {
      method: 'POST',
      body: JSON.stringify({ receiver_id: parseInt(toUserId, 10) }),
    },
  )
  return {
    id: String(res.sender_transaction.id),
    fromUserId: String(res.sender_transaction.user_id),
    toUserId,
    createdAt: res.sender_transaction.created_at,
  }
}

export async function fetchTeamPoints(_teamId: string): Promise<number> {
  const res = await request<{ users: { user_id: number; user_name: string; balance: number }[] }>(
    '/points/users',
  )
  return res.users.reduce((sum, u) => sum + u.balance, 0)
}

/**
 * Break Thunder / BTfever を発動する。
 * Break Thunder のみ scheduledAt（ISO8601）を指定可能。省略時は即時発動。
 * scheduled_at が返る場合は未来予約、null は即時発動。
 */
export async function startEvent(
  type: EventType,
  scheduledAt?: string,
): Promise<BTEvent & { scheduledAt: string | null }> {
  const isBreakThunder = type === 'break_thunder' || type === 'bt_time'
  const path = isBreakThunder ? '/points/time' : '/points/fever'
  const body = isBreakThunder && scheduledAt ? { scheduled_at: scheduledAt } : undefined

  const res = await request<TriggerEventBackendResponse>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })

  const isScheduled = res.scheduled_at != null
  const endsAt = isScheduled
    ? new Date(new Date(res.scheduled_at!).getTime() + 30 * 60_000).toISOString()
    : new Date(Date.now() + (isBreakThunder ? 15 : 60) * 60_000).toISOString()

  return {
    id: String(res.transaction.id),
    type: isBreakThunder ? 'break_thunder' : type,
    hostId: String(res.transaction.user_id),
    startedAt: res.transaction.created_at,
    endsAt,
    active: !isScheduled,
    scheduledAt: res.scheduled_at,
  }
}
