import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportsPage from './ReportsPage'
import * as reportsApi from '@/api/reports'
import type { Report } from '@/types'

// API はモック化 (ネットワーク遅延を排除して即時に解決)
vi.mock('@/api/reports')
const fetchReports = vi.mocked(reportsApi.fetchReports)
const createReport = vi.mocked(reportsApi.createReport)
const addReaction = vi.mocked(reportsApi.addReaction)

const existing: Report = {
  id: 'r-001',
  authorId: 'u-002',
  authorName: 'ユーザーA',
  content: 'スライド完成しました',
  createdAt: '2026-06-06T09:00:00+09:00',
  reactions: [],
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchReports.mockResolvedValue([existing])
  createReport.mockImplementation(async ({ content }) => ({
    id: 'r-new',
    authorId: 'u-001',
    authorName: 'テスト太郎',
    content,
    createdAt: '2026-06-06T10:00:00+09:00',
    reactions: [],
  }))
  addReaction.mockResolvedValue({ id: 'rx-1', userId: 'u-001', emoji: '⚡' })
})

describe('ReportsPage', () => {
  it('既存の日報を表示する', async () => {
    render(<ReportsPage />)
    expect(await screen.findByText('ユーザーA')).toBeInTheDocument()
    expect(screen.getByText('スライド完成しました')).toBeInTheDocument()
  })

  it('日報を投稿すると一覧の先頭に追加される', async () => {
    const user = userEvent.setup()
    render(<ReportsPage />)
    await screen.findByText('ユーザーA')

    await user.type(screen.getByLabelText('日報の本文'), '今日は実装しました')
    await user.click(screen.getByRole('button', { name: '投稿' }))

    expect(await screen.findByText('今日は実装しました')).toBeInTheDocument()
    expect(createReport).toHaveBeenCalledWith({ content: '今日は実装しました' })
  })

  it('空欄では投稿できない', async () => {
    const user = userEvent.setup()
    render(<ReportsPage />)
    await screen.findByText('ユーザーA')

    await user.click(screen.getByRole('button', { name: '投稿' }))
    expect(createReport).not.toHaveBeenCalled()
  })

  it('リアクションを押すと件数が増える', async () => {
    const user = userEvent.setup()
    render(<ReportsPage />)
    await screen.findByText('ユーザーA')
    expect(screen.getByText('0 件')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '⚡' }))

    expect(await screen.findByText('1 件')).toBeInTheDocument()
    expect(addReaction).toHaveBeenCalledWith('r-001', '⚡')
  })
})
