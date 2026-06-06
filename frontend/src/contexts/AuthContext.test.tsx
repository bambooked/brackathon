import { act,renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { AuthProvider, useAuth } from './AuthContext'

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth', () => {
  it('初期状態は未ログイン', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('setAuth でログイン状態になり、clearAuth でログアウトする', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.setAuth({
        token: 'tok',
        user: { id: 'u-1', name: '太郎', email: 'a@b.com', teamId: 't-1' },
      })
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.name).toBe('太郎')

    act(() => result.current.clearAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })
})
