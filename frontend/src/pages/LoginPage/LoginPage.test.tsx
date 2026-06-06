import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/contexts/AuthContext'

import LoginPage from './LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// Google Identity Services はブラウザ外では動作しないためスタブ化
vi.mock('@/api/auth', () => ({
  loginWithGoogle: vi.fn(),
}))

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

  it('ログインページのタイトルを表示する', () => {
    renderLogin()
    expect(screen.getByText('⚡ BT ログイン')).toBeInTheDocument()
  })

  it('Googleログインの説明文を表示する', () => {
    renderLogin()
    expect(screen.getByText('Googleアカウントでログインしてください')).toBeInTheDocument()
  })

  it('Googleログインボタンの領域を表示する', () => {
    renderLogin()
    expect(screen.getByLabelText('Googleでログイン')).toBeInTheDocument()
  })
})
