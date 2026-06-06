// ============================================================
// ログインページ (チーム単位ログイン)
// 【先輩への受け渡しメモ】
//   - 認証は api/auth.ts の login() 経由。現在はモック。
//   - Googleアカウント連携を入れる場合はこの画面にボタンを追加予定。
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { login } from '@/api/auth'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()
  const [teamId, setTeamId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ teamId, email, password })
      setAuth(result)
      navigate('/', { replace: true })
    } catch {
      setError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bt-dark px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg bg-bt-cream p-8 shadow-lg"
      >
        <h1 className="text-center text-2xl font-bold text-bt-dark">⚡ BT ログイン</h1>

        <label className="block">
          <span className="text-sm font-medium">チームID</span>
          <input
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="mt-1 w-full rounded border p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">メールアドレス</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border p-2"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border p-2"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-bt-gold py-2 font-bold text-bt-dark disabled:opacity-50"
        >
          {loading ? '送信中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
