import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { clearToken, getToken, setToken } from '@/api/client'
import { getCurrentUser } from '@/api/auth'
import type { AuthResult, User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (result: AuthResult) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // リロード時にトークンが残っていればAPIからユーザーを復元する
  useEffect(() => {
    const storedToken = getToken()
    if (!storedToken) {
      setIsLoading(false)
      return
    }
    getCurrentUser()
      .then((u) => setUser(u))
      .catch(() => {
        // トークンが無効なら削除してログアウト状態にする
        clearToken()
        setTokenState(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const setAuth = useCallback((result: AuthResult) => {
    setToken(result.token)
    setTokenState(result.token)
    setUser(result.user)
  }, [])

  const clearAuth = useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: user !== null, isLoading, setAuth, clearAuth }),
    [user, token, isLoading, setAuth, clearAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
