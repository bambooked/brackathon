// ============================================================
// 認証状態の共有 (Context)
// 【先輩への受け渡しメモ】
// トークン永続化は未実装 (メモリ保持のみ)。接続時に
// Cookie/HTTPOnly 等の方針が決まったら setToken 周りを調整してください。
// ============================================================
import { createContext, type ReactNode,useCallback, useContext, useMemo, useState } from 'react'

import type { AuthResult, User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  setAuth: (result: AuthResult) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const setAuth = useCallback((result: AuthResult) => {
    setUser(result.user)
    // TODO(api): result.token の保存方法は接続担当と要相談
  }, [])

  const clearAuth = useCallback(() => setUser(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, setAuth, clearAuth }),
    [user, setAuth, clearAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
