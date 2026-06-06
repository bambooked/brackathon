import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import HomePage from './HomePage'

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('トップタブが表示される', () => {
    renderPage()
    expect(screen.getByRole('button', { name: '📰 日報' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔍 人で探す' })).toBeInTheDocument()
  })

  it('日報タブ: 今日のサンプル日報が表示される', () => {
    renderPage()
    expect(screen.getAllByText('鈴木花子').length).toBeGreaterThan(0)
    expect(screen.getAllByText('田中一郎').length).toBeGreaterThan(0)
  })

  it('日報タブ: 年月ナビと日付チップが表示される', () => {
    renderPage()
    expect(screen.getAllByText(/2026年6月/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /6\/4/ })).toBeInTheDocument()
  })

  it('日報タブ: 前月に移動できる', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '前の月' }))
    expect(screen.getByText('2026年5月')).toBeInTheDocument()
  })

  it('日報タブ: 日付チップ選択でその日の日報を表示', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /6\/4/ }))
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
  })

  it('アイコンタップでパーソンビューに遷移する', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '鈴木花子の日報を見る' }))
    expect(screen.getByText('鈴木花子さんの日報')).toBeInTheDocument()
  })

  it('人で探すタブ: メンバー一覧が表示される', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    expect(screen.getAllByText('鈴木花子').length).toBeGreaterThan(0)
    expect(screen.getAllByText('田中一郎').length).toBeGreaterThan(0)
  })

  it('人で探すタブ: メンバー選択でパーソンビューになる', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /鈴木花子/ })[0])
    expect(screen.getByText('鈴木花子さんの日報')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '今日の投稿' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全期間' })).toBeInTheDocument()
  })

  it('パーソンビュー: 一覧に戻るで戻れる', () => {
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /人で探す/ }))
    fireEvent.click(screen.getAllByRole('button', { name: /鈴木花子/ })[0])
    fireEvent.click(screen.getByRole('button', { name: /一覧に戻る/ }))
    expect(screen.queryByText('鈴木花子さんの日報')).not.toBeInTheDocument()
  })
})
