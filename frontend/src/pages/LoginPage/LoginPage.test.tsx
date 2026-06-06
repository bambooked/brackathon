// ============================================================
// LoginPage のテスト (TDD の見本)
// ------------------------------------------------------------
// TDD の進め方:
//   1. このテストを先に書く (この時点では LoginPage 未実装で red)
//   2. テストが通る最小限の実装を書く (green)
//   3. リファクタする (refactor)
// ============================================================
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import LoginPage from './LoginPage'
import * as authApi from '@/api/auth'

// react-router の useNavigate をスパイ化
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('入力フォームを表示する', () => {
    renderLogin()
    expect(screen.getByLabelText('チームID')).toBeInTheDocument()
    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument()
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument()
  })

  it('送信すると login API を呼び、成功後にトップへ遷移する', async () => {
    const loginSpy = vi.spyOn(authApi, 'login')
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText('チームID'), 'team-1')
    await user.type(screen.getByLabelText('メールアドレス'), 'a@example.com')
    await user.type(screen.getByLabelText('パスワード'), 'pw')
    await user.click(screen.getByRole('button', { name: 'ログイン' }))

    expect(loginSpy).toHaveBeenCalledWith({
      teamId: 'team-1',
      email: 'a@example.com',
      password: 'pw',
    })
    // login は非同期。成功後トップ ("/") に遷移するまで待つ
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
  })
})
