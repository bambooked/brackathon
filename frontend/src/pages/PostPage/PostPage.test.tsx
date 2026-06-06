import { fireEvent,render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import PostPage from './PostPage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u-001', name: '山田太郎', teamId: 't-001' } }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <PostPage />
    </MemoryRouter>,
  )
}

describe('PostPage', () => {
  it('タイトルが表示される', () => {
    renderPage()
    expect(screen.getByText('日報を投稿')).toBeInTheDocument()
  })

  it('当日投稿済みの場合は確認画面が表示される', () => {
    renderPage()
    // サンプルデータが入っているので投稿済み確認画面になる
    expect(screen.getByText('今日の日報はすでに投稿済みです')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /修正する/ })).toBeInTheDocument()
  })

  it('修正するボタンで編集フォームが表示される', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
    expect(screen.getByLabelText('日報の日時')).toBeInTheDocument()
    expect(screen.getByLabelText('日報の本文')).toBeInTheDocument()
  })

  it('修正モードでは更新ボタンが表示される', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
    expect(screen.getByRole('button', { name: /更新する/ })).toBeInTheDocument()
  })

  it('修正モードで本文が空なら更新ボタンが無効', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
    const textarea = screen.getByLabelText('日報の本文')
    fireEvent.change(textarea, { target: { value: '' } })
    expect(screen.getByRole('button', { name: /更新する/ })).toBeDisabled()
  })

  it('500文字を超えて入力できない', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /修正する/ }))
    const textarea = screen.getByLabelText('日報の本文')
    fireEvent.change(textarea, { target: { value: 'a'.repeat(600) } })
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(500)
  })
})
