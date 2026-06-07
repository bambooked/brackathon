import { type ChangeEvent, useEffect, useRef, useState } from 'react'
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
const TEAM_OPTIONS = ['チームA', 'チームB', 'チームC']

export default function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated, setAuth } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const selectedTeamRef = useRef(TEAM_OPTIONS[0])
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(TEAM_OPTIONS[0])

  // setAuth 後に isAuthenticated が true になったタイミングで遷移する
  // （Google コールバック内で直接 navigate するとコミット前に RequireAuth に弾かれるため）
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  function handleTeamChange(e: ChangeEvent<HTMLSelectElement>) {
    selectedTeamRef.current = e.target.value
    setSelectedTeam(e.target.value)
  }

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
            const result = await loginWithGoogle(credential, selectedTeamRef.current)
            setAuth(result)
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bt-dark px-4">
      {/* BT包装紙風の背景装飾 */}
      <div className="bt-zigzag-decoration bt-zigzag-left" />
      <div className="bt-zigzag-decoration bt-zigzag-right" />
      <div className="bt-thunder-center" />

      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-xl border-2 border-bt-thunder bg-bt-card p-8 text-center shadow-2xl shadow-bt-thunder/20">
        <div className="flex justify-center mb-2">
          <img
            src="/blackathon_sticker-09_BTDD.png"
            alt="BTアプリアイコン"
            className="h-56 w-56 object-contain drop-shadow-xl"
          />
        </div>
        <h1 className="font-black text-bt-thunder">BT ログイン</h1>
        <p
          className="text-sm font-black text-bt-gray"
          style={{ fontFamily: 'var(--bt-display-font)' }}
        >
          Googleアカウントでログインしてください
        </p>
        <div className="text-left space-y-1">
          <label htmlFor="team-name" className="block text-xs font-black text-bt-gray" style={{ fontFamily: 'var(--bt-display-font)' }}>
            チーム
          </label>
          <select
            id="team-name"
            aria-label="チーム"
            value={selectedTeam}
            onChange={handleTeamChange}
            className="w-full rounded-lg border border-bt-thunder/30 bg-bt-dark px-3 py-2 text-sm text-bt-cream outline-none focus:border-bt-thunder"
          >
            {TEAM_OPTIONS.map((team) => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
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
