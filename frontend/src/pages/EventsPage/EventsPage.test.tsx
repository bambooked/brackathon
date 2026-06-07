import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach,describe, expect, it, vi } from 'vitest'

import * as pointsApi from '@/api/points'

import EventsPage from './EventsPage'

vi.mock('@/api/points')
const startEvent = vi.mocked(pointsApi.startEvent)

beforeEach(() => {
  vi.clearAllMocks()
  startEvent.mockImplementation(async (type) => ({
    id: 'e-1',
    type,
    hostId: 'u-001',
    startedAt: '2026-06-06T10:00:00+09:00',
    endsAt: '2026-06-06T10:15:00+09:00',
    active: true,
    scheduledAt: null,
  }))
})

describe('EventsPage', () => {
  it('各イベントの消費ポイントを表示する', () => {
    render(<EventsPage />)
    expect(screen.getByText('消費 50 PT')).toBeInTheDocument() // BTtime
    expect(screen.getByText('消費 150 PT')).toBeInTheDocument() // BTfever
  })

  it('BTtime を開始できる', async () => {
    const user = userEvent.setup()
    render(<EventsPage />)

    await user.click(screen.getByRole('button', { name: /BTtime/ }))

    expect(await screen.findByText('BTtime を開始しました！')).toBeInTheDocument()
    expect(startEvent).toHaveBeenCalledWith('bt_time')
  })

  it('BTfever を開始できる', async () => {
    const user = userEvent.setup()
    render(<EventsPage />)

    await user.click(screen.getByRole('button', { name: /BTfever/ }))

    expect(await screen.findByText('BTfever を開始しました！')).toBeInTheDocument()
    expect(startEvent).toHaveBeenCalledWith('bt_fever')
  })
})
