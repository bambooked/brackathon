import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchBreakThunderMessages,
  postBreakThunderMessage,
  type BreakThunderActive,
  type BreakThunderMessage,
} from '@/api/breakThunder'

const MAX_LENGTH = 240

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}

function getRemainingLabel(endsAt: string | null) {
  if (!endsAt) return ''
  const seconds = Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export default function BreakThunderPage() {
  const [active, setActive] = useState<BreakThunderActive>({
    active: false,
    scheduleId: null,
    endsAt: null,
  })
  const [messages, setMessages] = useState<BreakThunderMessage[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [nowTick, setNowTick] = useState(0)

  useEffect(() => {
    fetchBreakThunderMessages()
      .then((res) => {
        setActive(res.active)
        setMessages(res.messages)
      })
      .catch(() => setError('掲示板を読み込めませんでした'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNowTick((v) => v + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  const isExpired = useMemo(() => {
    if (!active.endsAt) return true
    return new Date(active.endsAt).getTime() <= Date.now()
  }, [active.endsAt, nowTick])

  const canPost = active.active && !isExpired

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || submitting || !canPost) return
    setSubmitting(true)
    setError('')
    try {
      const message = await postBreakThunderMessage(body)
      setMessages((prev) => [...prev, message])
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿できませんでした')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-bt-dark/30">読み込み中...</span>
      </div>
    )
  }

  if (!canPost) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Break Thunder 掲示板</h1>
          <p className="text-sm text-bt-dark/50 mt-1">Break Thunder 開催中だけ開く15分限定の掲示板です。</p>
        </div>
        <div className="rounded-xl border border-bt-dark/10 bg-white p-6 text-center shadow-sm">
          <p className="text-4xl mb-3">☕</p>
          <p className="font-bold text-bt-dark">いまは掲示板が閉じています</p>
          <p className="mt-1 text-sm text-bt-dark/50">BTショップからBreak Thunderを発動すると開きます。</p>
          <Link
            to="/shop"
            className="mt-5 inline-flex rounded-lg bg-bt-gold px-5 py-2.5 text-sm font-bold text-bt-dark hover:brightness-105"
          >
            BTショップへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Break Thunder 掲示板</h1>
          <p className="text-sm text-bt-dark/50 mt-1">一息ついていることをチームで残そう。</p>
        </div>
        <div className="rounded-xl bg-bt-gold/20 px-4 py-2 text-center">
          <p className="text-xs text-bt-dark/50">残り</p>
          <p className="text-2xl font-bold text-bt-gold">{getRemainingLabel(active.endsAt)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-bt-gold/40 bg-white p-5 shadow-sm">
        <label htmlFor="break-thunder-message" className="block text-sm font-bold text-bt-dark/70">
          いま何で一息ついてる？
        </label>
        <textarea
          id="break-thunder-message"
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
          rows={4}
          placeholder="例: ブラックサンダー食べながらレビュー待ち。15分だけ頭を冷やします。"
          className="mt-2 w-full resize-none rounded-lg border border-bt-dark/15 p-3 text-sm leading-relaxed outline-none focus:border-bt-gold"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-bt-dark/40">
            {active.endsAt && `${formatTime(active.endsAt)} まで投稿できます`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-bt-dark/40">{body.length} / {MAX_LENGTH}</span>
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="rounded-lg bg-bt-gold px-5 py-2.5 text-sm font-bold text-bt-dark disabled:opacity-40 hover:brightness-105"
            >
              {submitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      </form>

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-bt-dark/60">
          休憩ログ
        </h2>
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-bt-dark/15 bg-white/60 py-8 text-center text-sm text-bt-dark/35">
            まだ投稿はありません
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li key={message.id} className="rounded-xl border border-bt-dark/5 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold text-bt-dark">{message.userName}</p>
                  <span className="text-xs text-bt-dark/40">{formatTime(message.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-bt-dark/80">{message.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
