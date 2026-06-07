import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import App from './App'
import { AuthProvider } from './contexts/AuthContext'

// ページが import する API はモック (描画時の副作用を抑える)
vi.mock('@/api/points')
vi.mock('@/api/reports')

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ルーティングの認証ガード', () => {
  it('未ログインで保護ページに来たら /login にリダイレクトされる', () => {
    renderAt('/')
    // ログイン画面が表示される
    expect(screen.getByText('BT ログイン')).toBeInTheDocument()
  })

  it('未ログインで /reports に来てもログイン画面になる', () => {
    renderAt('/reports')
    expect(screen.getByText('Googleアカウントでログインしてください')).toBeInTheDocument()
  })
})
