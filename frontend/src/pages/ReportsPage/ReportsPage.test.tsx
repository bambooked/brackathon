import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as reportsApi from '@/api/reports'
import type { Report } from '@/types'

import ReportsPage from './ReportsPage'

vi.mock('@/api/reports')
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-001', name: 'テスト太郎', email: 'test@example.com', teamId: 'team-1' },
    token: 'test-token',
    isAuthenticated: true,
    isLoading: false,
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
  }),
}))

const fetchReports = vi.mocked(reportsApi.fetchReports)
const createReport = vi.mocked(reportsApi.createReport)
const addReaction = vi.mocked(reportsApi.addReaction)
const removeReaction = vi.mocked(reportsApi.removeReaction)

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
  removeReaction.mockResolvedValue(undefined)
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

  it('自分がリアクション済みの絵文字を押すと取り消される', async () => {
    const reportWithMyReaction: Report = {
      ...existing,
      reactions: [{ id: 'rx-1', userId: 'u-001', emoji: '⚡' }],
    }
    fetchReports.mockResolvedValue([reportWithMyReaction])

    const user = userEvent.setup()
    render(<ReportsPage />)
    await screen.findByText('ユーザーA')
    expect(screen.getByText('1 件')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '⚡' }))

    expect(await screen.findByText('0 件')).toBeInTheDocument()
    expect(removeReaction).toHaveBeenCalledWith('r-001', '⚡')
    expect(addReaction).not.toHaveBeenCalled()
  })
})
