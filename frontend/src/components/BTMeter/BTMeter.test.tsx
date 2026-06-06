import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BTMeter, { clampPercent } from './BTMeter'

describe('clampPercent', () => {
  it('割合を0〜100に丸める', () => {
    expect(clampPercent(50, 100)).toBe(50)
    expect(clampPercent(0, 100)).toBe(0)
    expect(clampPercent(150, 100)).toBe(100) // 上限超えは100
    expect(clampPercent(-10, 100)).toBe(0) // 負は0
  })

  it('max が0以下なら0を返す', () => {
    expect(clampPercent(10, 0)).toBe(0)
  })
})

describe('BTMeter', () => {
  it('現在値の割合を表示する', () => {
    render(<BTMeter current={40} max={80} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('満タンでフィーバー表示になる', () => {
    render(<BTMeter current={80} max={80} />)
    expect(screen.getByText('⚡FEVER!⚡')).toBeInTheDocument()
  })
})
