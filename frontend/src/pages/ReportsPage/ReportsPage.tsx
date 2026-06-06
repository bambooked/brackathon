// ============================================================
// 日報ページ — 日報の一覧表示 + 投稿 + リアクション
// 【先輩への受け渡しメモ】
// リアクション時は自分と相手の双方へPT付与される想定 (バック処理)。
// ============================================================
import { useEffect, useState } from 'react'

import { addReaction, createReport, fetchReports, removeReaction } from '@/api/reports'
import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types'

const REACTION_EMOJIS = ['⚡', '👍', '🔥', '🙏']

export default function ReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    fetchReports().then(setReports)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    const created = await createReport({ content: draft })
    setReports((prev) => [created, ...prev])
    setDraft('')
  }

  async function handleReaction(reportId: string, emoji: string, alreadyReacted: boolean) {
    if (alreadyReacted) {
      await removeReaction(reportId, emoji)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, reactions: r.reactions.filter((rx) => !(rx.userId === user?.id && rx.emoji === emoji)) }
            : r,
        ),
      )
    } else {
      const reaction = await addReaction(reportId, emoji)
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, reactions: [...r.reactions, reaction] } : r,
        ),
      )
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日報</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          aria-label="日報の本文"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="今日やったこと・ホウレンソウを書こう"
          className="w-full rounded border p-2"
          rows={3}
        />
        <button type="submit" className="rounded bg-bt-gold px-4 py-2 font-bold text-bt-dark">
          投稿
        </button>
      </form>

      <ul className="space-y-4">
        {reports.map((report) => (
          <li key={report.id} className="rounded-lg bg-white p-4 shadow">
            <p className="font-bold">{report.authorName}</p>
            <p className="whitespace-pre-wrap">{report.content}</p>
            <div className="mt-2 flex gap-2">
              {REACTION_EMOJIS.map((emoji) => {
                const alreadyReacted = user
                  ? report.reactions.some((rx) => rx.userId === user.id && rx.emoji === emoji)
                  : false
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(report.id, emoji, alreadyReacted)}
                    className={`rounded-full border px-2 py-1 text-sm ${
                      alreadyReacted
                        ? 'bg-bt-gold font-bold'
                        : 'hover:bg-bt-cream'
                    }`}
                  >
                    {emoji}
                  </button>
                )
              })}
              <span className="ml-2 text-sm text-bt-dark/60">
                {report.reactions.length} 件
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
