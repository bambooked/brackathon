import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import InvisibleTaskPage from './InvisibleTaskPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <InvisibleTaskPage />
    </MemoryRouter>,
  )
}

describe('InvisibleTaskPage', () => {
  it('タイトルが表示される', () => {
    renderPage()
    expect(screen.getByText(/見えない業務の見える化/)).toBeInTheDocument()
  })

  it('メンバー選択と入力フォームが表示される', () => {
    renderPage()
    expect(screen.getByLabelText('対象メンバー')).toBeInTheDocument()
    expect(screen.getByLabelText('見えない業務の内容')).toBeInTheDocument()
  })

  it('送信ボタンは空のとき無効', () => {
    renderPage()
    expect(screen.getByRole('button', { name: /送信してPTを贈る/ })).toBeDisabled()
  })

  it('テキスト入力で送信ボタンが有効になる', () => {
    renderPage()
    fireEvent.change(screen.getByLabelText('見えない業務の内容'), {
      target: { value: 'MTGの議事録を毎回まとめてくれている' },
    })
    expect(screen.getByRole('button', { name: /送信してPTを贈る/ })).not.toBeDisabled()
  })

  it('自分への報告セクションが表示される', () => {
    renderPage()
    expect(screen.getByText(/自分への報告/)).toBeInTheDocument()
  })

  it('自分宛のサンプル報告が表示される', () => {
    renderPage()
    expect(screen.getByText('鈴木花子 より')).toBeInTheDocument()
    expect(screen.getByText('田中一郎 より')).toBeInTheDocument()
  })

  it('300文字を超えて入力できない', () => {
    renderPage()
    const textarea = screen.getByLabelText('見えない業務の内容')
    fireEvent.change(textarea, { target: { value: 'a'.repeat(400) } })
    expect((textarea as HTMLTextAreaElement).value).toHaveLength(300)
  })
})
