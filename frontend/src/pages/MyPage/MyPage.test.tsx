import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authApi from '@/api/auth'
import * as pointsApi from '@/api/points'
import * as reportsApi from '@/api/reports'

import MyPage from './MyPage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-001', name: '山田太郎', teamId: 't-001' } }),
}))

vi.mock('@/api/points')
vi.mock('@/api/reports')
vi.mock('@/api/auth')

const fetchMyPoints = vi.mocked(pointsApi.fetchMyPoints)
const fetchPointHistory = vi.mocked(pointsApi.fetchPointHistory)
const fetchReports = vi.mocked(reportsApi.fetchReports)
const updateProfile = vi.mocked(authApi.updateProfile)

beforeEach(() => {
  vi.clearAllMocks()
  // 初期表示はサンプルデータで担保し、API はデフォルト解決させる
  fetchMyPoints.mockResolvedValue(23)
  fetchPointHistory.mockResolvedValue([])
  fetchReports.mockResolvedValue([])
  updateProfile.mockResolvedValue({ id: 'u-001', name: '山田太郎', email: 'test@example.com', teamId: 't-001' })
})

function renderPage() {
  return render(
    <MemoryRouter>
      <MyPage />
    </MemoryRouter>,
  )
}

describe('MyPage', () => {
  it('マイページのタイトルが表示される', () => {
    renderPage()
    expect(screen.getByText('マイページ')).toBeInTheDocument()
  })

  it('ポイント残高が表示される', () => {
    renderPage()
    // 初期値 SAMPLE_MY_POINTS=23 が即時表示される
    expect(screen.getByText('23')).toBeInTheDocument()
  })

  it('ポイント履歴が表示される', () => {
    renderPage()
    expect(screen.getAllByText('リアクションをもらった').length).toBeGreaterThan(0)
    expect(screen.getAllByText('見えない業務を見える化 (AI)').length).toBeGreaterThan(0)
  })

  it('プロフィール設定フォームが表示される', () => {
    renderPage()
    expect(screen.getByLabelText('本名')).toBeInTheDocument()
    expect(screen.getByLabelText('ニックネーム')).toBeInTheDocument()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('ニックネームトグルが動作する', () => {
    renderPage()
    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('アーカイブトグルが動作する', () => {
    renderPage()
    const toggle = screen.getByText(/自分の日報アーカイブ/)
    expect(screen.queryByText(/Vitestの導入/)).not.toBeInTheDocument()
    fireEvent.click(toggle)
    expect(screen.getByText(/Vitestの導入/)).toBeInTheDocument()
  })
})
