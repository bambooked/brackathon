import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createReport, fetchMyTodayReport, updateReport } from '@/api/reports'
import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types'

const MAX_LENGTH = 500

function nowLocalString() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [existingReport, setExistingReport] = useState<Report | null>(null)
  const [reportedAt, setReportedAt] = useState(nowLocalString)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchMyTodayReport(user.id)
      .then((report) => {
        setExistingReport(report)
        if (report) {
          setContent(report.content)
          setReportedAt(toDatetimeLocal(report.createdAt))
        }
      })
      .catch(() => {/* ログイン前など */})
      .finally(() => setLoading(false))
  }, [user])

  const isEditMode = existingReport !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      if (isEditMode) {
        await updateReport(existingReport.id, { content })
      } else {
        await createReport({ content, reportedAt })
      }
      setSubmitted(true)
      setTimeout(() => navigate('/'), 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-bt-gray-dark">読み込み中...</span>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl animate-pulse-thunder">⚡</span>
        <p className="text-xl font-bold text-bt-thunder">
          {isEditMode ? '更新しました！' : '投稿しました！'}
        </p>
        <p className="text-sm text-bt-gray">ホームに戻ります...</p>
      </div>
    )
  }

  if (isEditMode && !isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-bt-cream">日報を投稿</h1>
          {user && <p className="text-sm text-bt-gray-dark mt-0.5">{user.name} として投稿</p>}
        </div>

        <div className="rounded-xl bg-bt-thunder/20 border-2 border-bt-thunder p-5 space-y-3 shadow-lg shadow-bt-thunder/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <p className="font-bold text-bt-cream">今日の日報はすでに投稿済みです</p>
          </div>
          <p className="text-sm text-bt-gray whitespace-pre-wrap line-clamp-3">
            {existingReport?.content}
          </p>
          <p className="text-xs text-bt-gray-dark">
            投稿日時: {new Date(existingReport?.createdAt ?? '').toLocaleString('ja-JP')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-lg border border-bt-thunder/30 py-3 font-medium text-bt-gray hover:bg-bt-card-hover transition-all"
          >
            戻る
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 rounded-lg bg-bt-thunder py-3 font-bold text-bt-black hover:bg-bt-gold-bright transition-all shadow-lg shadow-bt-thunder/30"
          >
            修正する ✏️
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-bt-cream">
          {isEditMode ? '日報を修正' : '日報を投稿'}
        </h1>
        {user && <p className="text-sm text-bt-gray-dark mt-0.5">{user.name} として投稿</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-bt-card shadow-lg shadow-bt-black/50 border border-bt-thunder/20 px-5 py-4">
          <label htmlFor="post-datetime" className="block text-sm font-medium mb-2 text-bt-gray">📅 日時</label>
          <input
            id="post-datetime"
            type="datetime-local"
            aria-label="日報の日時"
            value={reportedAt}
            onChange={(e) => setReportedAt(e.target.value)}
            className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream px-3 py-2 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all"
          />
          {!isEditMode && (
            <p className="text-xs text-bt-gray-dark mt-1.5">
              過去の業務についても遡って投稿できます
            </p>
          )}
        </div>

        <div className="rounded-xl bg-bt-card shadow-lg shadow-bt-black/50 border border-bt-thunder/20 overflow-hidden">
          <label htmlFor="post-content" className="block px-5 pt-4 text-sm font-medium text-bt-gray">📝 内容</label>
          <textarea
            id="post-content"
            aria-label="日報の本文"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={`今日やったこと、気づいたこと、ホウレンソウを書こう\n\n例:\n・○○機能の実装が完了\n・△△さんとDB設計をレビュー\n・来週は□□を予定`}
            className="w-full resize-none px-5 pt-2 pb-4 text-sm leading-relaxed outline-none bg-bt-black/20 text-bt-cream placeholder:text-bt-gray-dark"
            rows={10}
          />
          <div className="flex justify-end border-t border-bt-thunder/10 px-5 py-2 bg-bt-black/30">
            <span
              className={`text-xs font-mono ${
                content.length >= MAX_LENGTH ? 'text-red-400' : 'text-bt-gray-dark'
              }`}
            >
              {content.length} / {MAX_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => (isEditMode ? setIsEditing(false) : navigate('/'))}
            className="flex-1 rounded-lg border border-bt-thunder/30 py-3 font-medium text-bt-gray hover:bg-bt-card-hover transition-all"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex-1 rounded-lg bg-bt-thunder py-3 font-bold text-bt-black disabled:opacity-40 hover:bg-bt-gold-bright transition-all shadow-lg shadow-bt-thunder/30"
          >
            {submitting
              ? isEditMode ? '更新中...' : '投稿中...'
              : isEditMode ? '更新する ⚡' : '投稿する ⚡'}
          </button>
        </div>
      </form>
    </div>
  )
}
