import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PresentPage from './PresentPage'
import * as pointsApi from '@/api/points'

vi.mock('@/api/points')
const sendPresent = vi.mocked(pointsApi.sendPresent)

beforeEach(() => {
  vi.clearAllMocks()
  sendPresent.mockResolvedValue({
    id: 'p-1',
    fromUserId: 'u-001',
    toUserId: 'u-003',
    message: 'おつかれ',
    createdAt: '2026-06-06T10:00:00+09:00',
  })
})

describe('PresentPage', () => {
  it('相手とメッセージを指定して送れる', async () => {
    const user = userEvent.setup()
    render(<PresentPage />)

    await user.selectOptions(screen.getByLabelText('送る相手'), 'u-003')
    await user.type(screen.getByLabelText('メッセージ'), 'おつかれ')
    await user.click(screen.getByRole('button', { name: '渡す' }))

    expect(await screen.findByText('BTを渡しました！')).toBeInTheDocument()
    expect(sendPresent).toHaveBeenCalledWith('u-003', 'おつかれ')
  })

  it('送信後にメッセージ入力がクリアされる', async () => {
    const user = userEvent.setup()
    render(<PresentPage />)

    const message = screen.getByLabelText('メッセージ') as HTMLInputElement
    await user.type(message, 'ありがとう')
    await user.click(screen.getByRole('button', { name: '渡す' }))

    await screen.findByText('BTを渡しました！')
    expect(message.value).toBe('')
  })
})
