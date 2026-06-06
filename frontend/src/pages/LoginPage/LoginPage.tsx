import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { loginWithGoogle } from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google || !buttonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setError('')
          try {
            const result = await loginWithGoogle(credential)
            setAuth(result)
            navigate('/', { replace: true })
          } catch {
            setError('ログインに失敗しました。もう一度お試しください。')
          }
        },
      })
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        locale: 'ja',
      })
    }
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [navigate, setAuth])

  return (
    <div className="flex min-h-screen items-center justify-center bg-bt-dark px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg bg-bt-cream p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-bt-dark">⚡ BT ログイン</h1>
        <p className="text-sm text-bt-dark/60">Googleアカウントでログインしてください</p>
        <div className="flex justify-center" ref={buttonRef} aria-label="Googleでログイン" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!GOOGLE_CLIENT_ID && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded p-2">
            VITE_GOOGLE_CLIENT_ID が未設定です
          </p>
        )}
      </div>
    </div>
  )
}
