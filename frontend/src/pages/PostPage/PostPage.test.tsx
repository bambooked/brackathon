import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as reportsApi from '@/api/reports'
import type { Report } from '@/types'

import PostPage from './PostPage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-001', name: '山田太郎', teamId: 't-001' } }),
}))

vi.mock('@/api/reports')
const fetchMyTodayReport = vi.mocked(reportsApi.fetchMyTodayReport)
const createReport = vi.mocked(reportsApi.createReport)
const updateReport = vi.mocked(reportsApi.updateReport)

const sampleReport: Report = {
  id: 'r-my-today',
  authorId: 'u-001',
  authorName: '山田太郎',
  content: 'フロントのコンポーネント設計をまとめた。Atomic Designで整理する方向で進めることにした。明日チームに共有予定。',
  createdAt: '2026-06-06T09:30:00+09:00',
  reactions: [],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <PostPage />
    </MemoryRouter>,
  )
}

describe('PostPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createReport.mockResolvedValue({ ...sampleReport, id: 'r-new' })
    updateReport.mockResolvedValue({ ...sampleReport })
  })

  describe('当日投稿済みの場合', () => {
    beforeEach(() => {
      fetchMyTodayReport.mockResolvedValue(sampleReport)
    })

    it('タイトルが表示される', async () => {
      renderPage()
      expect(await screen.findByText('日報を投稿')).toBeInTheDocument()
    })

    it('投稿済み確認画面が表示される', async () => {
      renderPage()
      expect(await screen.findByText('今日の日報はすでに投稿済みです')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /修正する/ })).toBeInTheDocument()
    })

    it('修正するボタンで編集フォームが表示される', async () => {
      renderPage()
      await screen.findByText('今日の日報はすでに投稿済みです')
      fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
      expect(screen.getByLabelText('日報の日時')).toBeInTheDocument()
      expect(screen.getByLabelText('日報の本文')).toBeInTheDocument()
    })

    it('修正モードでは更新ボタンが表示される', async () => {
      renderPage()
      await screen.findByText('今日の日報はすでに投稿済みです')
      fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
      expect(screen.getByRole('button', { name: /更新する/ })).toBeInTheDocument()
    })

    it('修正モードで本文が空なら更新ボタンが無効', async () => {
      renderPage()
      await screen.findByText('今日の日報はすでに投稿済みです')
      fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
      const textarea = screen.getByLabelText('日報の本文')
      fireEvent.change(textarea, { target: { value: '' } })
      expect(screen.getByRole('button', { name: /更新する/ })).toBeDisabled()
    })

    it('500文字を超えて入力できない', async () => {
      renderPage()
      await screen.findByText('今日の日報はすでに投稿済みです')
      fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
      const textarea = screen.getByLabelText('日報の本文')
      fireEvent.change(textarea, { target: { value: 'a'.repeat(600) } })
      expect((textarea as HTMLTextAreaElement).value).toHaveLength(500)
    })
  })

  describe('当日未投稿の場合', () => {
    beforeEach(() => {
      fetchMyTodayReport.mockResolvedValue(null)
    })

    it('新規投稿フォームが表示される', async () => {
      renderPage()
      await waitFor(() => {
        expect(screen.getByLabelText('日報の本文')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: /投稿する/ })).toBeInTheDocument()
    })
  })
})
