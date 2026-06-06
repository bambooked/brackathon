import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as reportsApi from '@/api/reports'
import type { Report } from '@/types'

// useAuth をモック（HomePageで使用）
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/AuthContext')>()
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u-001', name: 'テスト太郎', email: 'a@example.com', teamId: 't-1' },
      isAuthenticated: true,
      isLoading: false,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }),
  }
})

vi.mock('@/api/reports')
const fetchReports = vi.mocked(reportsApi.fetchReports)
const fetchAllReports = vi.mocked(reportsApi.fetchAllReports)
const addReaction = vi.mocked(reportsApi.addReaction)

const TODAY_REPORTS: Report[] = [
  {
    id: 'r-001', authorId: 'u-002', authorName: '鈴木花子',
    content: '今日の作業内容です。',
    createdAt: new Date().toISOString(),
    reactions: [{ id: 'rx-001', userId: 'u-001', emoji: '👍' }],
  },
  {
    id: 'r-002', authorId: 'u-003', authorName: '田中一郎',
    content: 'バックエンドのレビューをしました。',
    createdAt: new Date().toISOString(),
    reactions: [],
  },
]

const ARCHIVE_REPORTS: Report[] = [
  {
    id: 'r-010', authorId: 'u-002', authorName: '鈴木花子',
    content: '先日の作業。',
    createdAt: '2026-06-04T10:00:00+09:00',
    reactions: [],
  },
  {
    id: 'r-011', authorId: 'u-001', authorName: 'テスト太郎',
    content: '先日の自分の作業。',
    createdAt: '2026-06-04T11:00:00+09:00',
    reactions: [],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  fetchReports.mockResolvedValue(TODAY_REPORTS)
  fetchAllReports.mockResolvedValue([...TODAY_REPORTS, ...ARCHIVE_REPORTS])
  addReaction.mockResolvedValue({ id: 'rx-new', userId: 'u-001', emoji: '⚡' })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

// ローカルインポート（vi.mock の後で）
import HomePage from './HomePage'

describe('HomePage', () => {
  it('トップタブが表示される', async () => {
    renderPage()
    expect(await screen.findByRole('button', { name: '📰 日報' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔍 人で探す' })).toBeInTheDocument()
  })

  it('日報タブ: APIから取得した今日の日報が表示される', async () => {
    renderPage()
    expect(await screen.findAllByText('鈴木花子')).not.toHaveLength(0)
    expect(await screen.findAllByText('田中一郎')).not.toHaveLength(0)
  })

  it('日報タブ: 年月ナビが表示される', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getAllByText(/2026年/).length).toBeGreaterThan(0)
    })
  })

  it('日報タブ: 日付チップ選択でその日の日報を表示', async () => {
    renderPage()
    // アーカイブの日付チップが表示されるまで待つ
    const chip = await screen.findByRole('button', { name: /6\/4/ })
    fireEvent.click(chip)
    expect(await screen.findByText('先日の作業。')).toBeInTheDocument()
  })

  it('アイコンタップでパーソンビューに遷移する', async () => {
    renderPage()
    const btn = await screen.findByRole('button', { name: '鈴木花子の日報を見る' })
    fireEvent.click(btn)
    expect(screen.getByText('鈴木花子さんの日報')).toBeInTheDocument()
  })

  it('人で探すタブ: メンバー一覧が表示される', async () => {
    renderPage()
    await screen.findAllByText('鈴木花子') // データロード待ち
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    expect(screen.getAllByText('鈴木花子').length).toBeGreaterThan(0)
    expect(screen.getAllByText('田中一郎').length).toBeGreaterThan(0)
  })

  it('人で探すタブ: メンバー選択でパーソンビューになる', async () => {
    renderPage()
    await screen.findAllByText('鈴木花子') // データロード待ち
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /鈴木花子/ })[0])
    expect(screen.getByText('鈴木花子さんの日報')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今日の投稿' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全期間' })).toBeInTheDocument()
  })

  it('パーソンビュー: 一覧に戻るで戻れる', async () => {
    renderPage()
    await screen.findAllByText('鈴木花子') // データロード待ち
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /鈴木花子/ })[0])
    fireEvent.click(screen.getByRole('button', { name: /一覧に戻る/ }))
    expect(screen.queryByText('鈴木花子さんの日報')).not.toBeInTheDocument()
  })
})
