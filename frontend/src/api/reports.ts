import type { NewReportInput, Reaction, Report } from '@/types'

import { request } from './client'

// バックエンドのレスポンス型
interface BackendUser {
  id: number
  name: string
  email: string
  role: string
  team_name: string
}

interface BackendReaction {
  id: number
  daily_report_id: number
  user_id: number
  type: string
  created_at: string
}

interface BackendReport {
  id: number
  user_id: number
  user: BackendUser
  report_date: string
  title: string | null
  body: string
  reactions: BackendReaction[]
  created_at: string
  updated_at: string
}

function mapReport(r: BackendReport): Report {
  return {
    id: String(r.id),
    authorId: String(r.user_id),
    authorName: r.user.name,
    content: r.body,
    createdAt: r.created_at,
    reactions: r.reactions.map((rx) => ({
      id: String(rx.id),
      userId: String(rx.user_id),
      emoji: rx.type,
    })),
  }
}

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export async function fetchReports(params?: {
  date?: string
  userId?: string
}): Promise<Report[]> {
  const qs = new URLSearchParams()
  if (params?.date) qs.set('report_date', params.date)
  if (params?.userId) qs.set('user_id', params.userId)
  const query = qs.size > 0 ? `?${qs.toString()}` : ''
  const res = await request<{ reports: BackendReport[] }>(`/reports${query}`)
  return res.reports.map(mapReport)
}

export async function fetchAllReports(): Promise<Report[]> {
  const res = await request<{ reports: BackendReport[] }>('/reports/all')
  return res.reports.map(mapReport)
}

export async function fetchMyTodayReport(userId: string): Promise<Report | null> {
  const reports = await fetchReports({ date: todayString(), userId })
  return reports[0] ?? null
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const reportDate = input.reportedAt ? input.reportedAt.slice(0, 10) : todayString()
  const res = await request<BackendReport & { points_awarded: number }>('/reports', {
    method: 'POST',
    body: JSON.stringify({
      report_date: reportDate,
      title: input.title ?? null,
      body: input.content,
    }),
  })
  return mapReport(res)
}

export async function updateReport(
  reportId: string,
  input: { content?: string; title?: string },
): Promise<Report> {
  const res = await request<BackendReport>(
    `/reports/${reportId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ title: input.title ?? null, body: input.content ?? null }),
    },
  )
  return mapReport(res)
}

export async function addReaction(reportId: string, emoji: string): Promise<Reaction> {
  const res = await request<{ reaction: BackendReaction; my_new_balance: number; message: string }>(
    `/reports/${reportId}/react`,
    {
      method: 'POST',
      body: JSON.stringify({ type: emoji }),
    },
  )
  return {
    id: String(res.reaction.id),
    userId: String(res.reaction.user_id),
    emoji: res.reaction.type,
  }
}

export async function removeReaction(reportId: string, emoji: string): Promise<void> {
  await request<{ message: string }>(
    `/reports/${reportId}/react?type=${encodeURIComponent(emoji)}`,
    { method: 'DELETE' },
  )
}
