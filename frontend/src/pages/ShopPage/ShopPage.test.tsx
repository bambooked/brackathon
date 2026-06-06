import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import ShopPage from './ShopPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <ShopPage />
    </MemoryRouter>,
  )
}

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

  it('所持ポイントが表示される', () => {
    renderPage()
    expect(screen.getByText('23')).toBeInTheDocument()
  })

  it('BTプレゼント選択で確認パネルが開く', () => {
    renderPage()
    // ショップアイテムは button 要素なので role で取得
    fireEvent.click(screen.getByRole('button', { name: /BTプレゼント/ }))
    expect(screen.getByText('送る相手')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /確定する/ })).toBeInTheDocument()
  })

  it('キャンセルで確認パネルが閉じる', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /BTプレゼント/ }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))
    expect(screen.queryByText('送る相手')).not.toBeInTheDocument()
  })
})
