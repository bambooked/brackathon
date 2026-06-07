import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  fetchBreakThunderMessages,
  postBreakThunderMessage,
  type BreakThunderActive,
  type BreakThunderMessage,
} from '@/api/breakThunder'
import { connectEventStream } from '@/api/events'

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

  // SSE購読: Break Thunderが発動されたらアクティブ状態とメッセージを再取得する
  useEffect(() => {
    const es = connectEventStream((event) => {
      if (event.type === 'break_thunder' || event.type === 'bt_time') {
        fetchBreakThunderMessages()
          .then((res) => {
            setActive(res.active)
            setMessages(res.messages)
          })
          .catch(() => {})
      }
    })
    return () => es.close()
  }, [])

  const isExpired = useMemo(() => {
    if (!active.endsAt) return true
    return new Date(active.endsAt).getTime() <= Date.now()
  // nowTick を依存に加えることで1秒ごとに再評価し、期限切れを即時反映する
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <span className="text-bt-gray animate-pulse-thunder">読み込み中...</span>
      </div>
    )
  }

  if (!canPost) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-bt-thunder">Break Thunder 掲示板</h1>
          <p className="text-sm text-bt-gray mt-1">Break Thunder 開催中だけ開く15分限定の掲示板です。</p>
        </div>
        <div
          className="rounded-xl border-4 border-bt-thunder shadow-2xl shadow-bt-thunder/10 overflow-hidden"
          style={{
            backgroundImage: 'url(/blackthunder.png)',
            backgroundSize: '130% 130%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div className="p-3">
            <div className="rounded-lg overflow-hidden p-8 text-center">
              <p className="text-5xl mb-4">☕</p>
              <p className="font-black text-bt-thunder text-lg">いまは掲示板が閉じています</p>
              <p className="mt-2 text-sm text-bt-gray">BTショップからBreak Thunderを発動すると開きます。</p>
              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-full bg-bt-thunder px-6 py-3 text-sm font-black text-bt-black hover:brightness-110 transition-all"
              >
                BTショップへ ⚡
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-bt-thunder">Break Thunder 掲示板</h1>
          <p className="text-sm text-bt-gray mt-1">一息ついていることをチームで残そう。</p>
        </div>
        <div className="rounded-xl border-2 border-bt-thunder/40 bg-bt-card px-4 py-3 text-center">
          <p className="text-xs text-bt-gray">残り</p>
          <p className="text-2xl font-black text-bt-thunder">{getRemainingLabel(active.endsAt)}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border-4 border-bt-thunder shadow-lg shadow-bt-thunder/20 overflow-hidden"
        style={{
          backgroundImage: 'url(/blackthunder.png)',
          backgroundSize: '130% 130%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <div className="p-3">
          <div className="rounded-lg overflow-hidden p-5">
            <label htmlFor="break-thunder-message" className="block text-sm font-black text-bt-gray mb-2">
              いま何で一息ついてる？
            </label>
            <textarea
              id="break-thunder-message"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, MAX_LENGTH))}
              rows={4}
              placeholder="例: ブラックサンダー食べながらレビュー待ち。15分だけ頭を冷やします。"
              className="w-full resize-none rounded-lg border border-bt-thunder/20 bg-bt-dark p-3 text-sm text-bt-cream leading-relaxed outline-none focus:border-bt-thunder"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-bt-gray">
                {active.endsAt && `${formatTime(active.endsAt)} まで投稿できます`}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-bt-gray">{body.length} / {MAX_LENGTH}</span>
                <button
                  type="submit"
                  disabled={!body.trim() || submitting}
                  className="rounded-full bg-bt-thunder px-5 py-2 text-sm font-black text-bt-black disabled:opacity-40 hover:brightness-110 transition-all"
                >
                  {submitting ? '投稿中...' : '投稿する ☕'}
                </button>
              </div>
            </div>
            {error && <p className="mt-3 rounded-lg bg-red-900/20 border border-red-400/30 px-3 py-2 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-bt-gray">
          休憩ログ
        </h2>
        {messages.length === 0 ? (
          <p className="rounded-xl border-2 border-dashed border-bt-thunder/20 bg-bt-card/50 py-10 text-center text-sm text-bt-gray">
            まだ投稿はありません
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <li
                key={message.id}
                className="rounded-xl border-4 border-bt-thunder shadow-lg shadow-bt-black/50 overflow-hidden"
                style={{
                  backgroundImage: 'url(/blackthunder.png)',
                  backgroundSize: '130% 130%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              >
                <div className="p-3">
                  <div className="rounded-lg overflow-hidden px-5 py-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-black text-bt-cream">{message.userName}</p>
                      <span className="text-xs text-bt-gray">{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-bt-gray">{message.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
