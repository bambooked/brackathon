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
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-bt-card border-2 border-bt-thunder p-8 shadow-2xl shadow-bt-thunder/20 text-center">
        <div className="flex justify-center mb-4">
          <img
            src="/blackthunder_logo-2.png"
            alt="Black Thunder"
            className="h-16 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-bt-thunder">⚡ BT ログイン</h1>
        <p className="text-sm text-bt-gray">Googleアカウントでログインしてください</p>
        <div className="flex justify-center" ref={buttonRef} aria-label="Googleでログイン" />
        {error && <p className="text-sm text-red-400 bg-red-900/20 border border-red-400/30 rounded-lg px-3 py-2">{error}</p>}
        {!GOOGLE_CLIENT_ID && (
          <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-400/30 rounded p-2">
            VITE_GOOGLE_CLIENT_ID が未設定です
          </p>
        )}
      </div>
    </div>
  )
}
