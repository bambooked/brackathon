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
  const { setAuth } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const selectedTeamRef = useRef(TEAM_OPTIONS[0])
  const [error, setError] = useState('')
  const [selectedTeam, setSelectedTeam] = useState(TEAM_OPTIONS[0])

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
        <label className="block text-left text-sm font-medium text-bt-dark/70" htmlFor="team-name">
          チーム
        </label>
        <select
          id="team-name"
          aria-label="チーム"
          value={selectedTeam}
          onChange={handleTeamChange}
          className="w-full rounded-lg border border-bt-dark/15 bg-white px-3 py-2 text-sm text-bt-dark outline-none focus:border-bt-gold"
        >
          {TEAM_OPTIONS.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
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
