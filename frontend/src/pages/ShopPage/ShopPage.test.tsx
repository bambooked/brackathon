import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as pointsApi from '@/api/points'
import * as authApi from '@/api/auth'

// useAuth をモック（ShopPageで使用）
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

vi.mock('@/api/points')
vi.mock('@/api/auth')
const fetchMyPoints = vi.mocked(pointsApi.fetchMyPoints)
const fetchUsers = vi.mocked(authApi.fetchUsers)

beforeEach(() => {
  vi.clearAllMocks()
  fetchMyPoints.mockResolvedValue(100)
  fetchUsers.mockResolvedValue([
    { id: 'u-002', name: '鈴木花子' },
    { id: 'u-003', name: '田中一郎' },
  ])
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ShopPage />
    </MemoryRouter>,
  )
}

import ShopPage from './ShopPage'

describe('ShopPage', () => {
  it('ショップタイトルが表示される', () => {
    renderPage()
    expect(screen.getByText('BTショップ')).toBeInTheDocument()
  })

  it('3つのアイテムが表示される', () => {
    renderPage()
    expect(screen.getByText('BTプレゼント')).toBeInTheDocument()
    expect(screen.getByText('BTtime')).toBeInTheDocument()
    expect(screen.getByText('BTfever')).toBeInTheDocument()
  })

  it('所持ポイントエリアが表示される', () => {
    renderPage()
    expect(screen.getByText('所持PT')).toBeInTheDocument()
  })

  it('BTプレゼント選択で確認パネルが開く', async () => {
    renderPage()
    // ポイントが0より大きくなるまで待つ（APIから返った後）
    await screen.findByText('100')
    fireEvent.click(screen.getByRole('button', { name: /BTプレゼント/ }))
    expect(screen.getByText('送る相手')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /確定する/ })).toBeInTheDocument()
  })

  it('キャンセルで確認パネルが閉じる', async () => {
    renderPage()
    await screen.findByText('100')
    fireEvent.click(screen.getByRole('button', { name: /BTプレゼント/ }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.queryByText('送る相手')).not.toBeInTheDocument()
  })
})
