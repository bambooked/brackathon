import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'
import * as pointsApi from '@/api/points'

// ログイン済みユーザーを固定するため useAuth をモック
vi.mock('@/contexts/AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/AuthContext')>()
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'u-001', name: 'テスト太郎', email: 'a@example.com', teamId: 't-1' },
      isAuthenticated: true,
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }),
  }
})

vi.mock('@/api/points')
const fetchMyPoints = vi.mocked(pointsApi.fetchMyPoints)
const fetchTeamPoints = vi.mocked(pointsApi.fetchTeamPoints)

beforeEach(() => {
  vi.clearAllMocks()
  fetchMyPoints.mockResolvedValue(12)
  fetchTeamPoints.mockResolvedValue(80)
})

describe('DashboardPage', () => {
  it('ユーザー名と保有ポイントを表示する', async () => {
    render(<DashboardPage />)
    expect(screen.getByText(/テスト太郎/)).toBeInTheDocument()
    expect(await screen.findByText('12 PT')).toBeInTheDocument()
  })

  it('チームポイントから BTメーターの割合を表示する', async () => {
    // teamPoints=80, 閾値=15*6=90 → 89%
    render(<DashboardPage />)
    expect(await screen.findByText('89%')).toBeInTheDocument()
  })
})
