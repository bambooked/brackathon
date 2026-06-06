// ============================================================
// 投稿画面 — 日報を新規投稿 / 当日分を修正
// 【先輩への受け渡しメモ】
//   - fetchTodayMyReport()  → GET /reports?authorId=me&date=today
//   - createReport()        → POST /reports { content, reportedAt }
//   - updateReport(id, ...) → PATCH /reports/:id { content, reportedAt }
//   - 投稿/更新成功後は / (ホーム) へリダイレクト
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types'

const MAX_LENGTH = 500

/** "YYYY-MM-DDThh:mm" 形式で現在日時を返す（datetime-local の初期値用） */
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

// ---- サンプルデータ（今日すでに投稿済みのケース） ----
// TODO(api): fetchTodayMyReport() に差し替え。未投稿なら null を返す。
const SAMPLE_TODAY_MY_REPORT: Report | null = {
  id: 'r-my-today',
  authorId: 'u-001',
  authorName: '山田太郎',
  content:
    'フロントのコンポーネント設計をまとめた。Atomic Designで整理する方向で進めることにした。明日チームに共有予定。',
  createdAt: '2026-06-06T09:30:00+09:00',
  reactions: [],
}
// null にすると新規投稿モードで確認できます
// ---- サンプルデータここまで ----

export default function PostPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // 遅延初期化: マウント時に一度だけ既存投稿を取得
  // TODO(api): () => fetchTodayMyReport() (async の場合は Suspense or loading state で対応)
  const [existingReport] = useState<Report | null>(() => SAMPLE_TODAY_MY_REPORT)
  const [reportedAt, setReportedAt] = useState(() =>
    existingReport ? toDatetimeLocal(existingReport.createdAt) : nowLocalString(),
  )
  const [content, setContent] = useState(() => existingReport?.content ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const isEditMode = existingReport !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      if (isEditMode) {
        // TODO(api): await updateReport(existingReport.id, { content, reportedAt }) に差し替え
        await new Promise((r) => setTimeout(r, 500))
      } else {
        // TODO(api): await createReport({ content, reportedAt }) に差し替え
        await new Promise((r) => setTimeout(r, 500))
      }
      setSubmitted(true)
      setTimeout(() => navigate('/'), 1200)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">⚡</span>
        <p className="text-xl font-bold text-bt-dark">
          {isEditMode ? '更新しました！' : '投稿しました！'}
        </p>
        <p className="text-sm text-bt-dark/50">ホームに戻ります...</p>
      </div>
    )
  }

  // 投稿済みで編集モードに入っていない場合は確認画面を表示
  if (isEditMode && !isEditing) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">日報を投稿</h1>
          {user && <p className="text-sm text-bt-dark/50 mt-0.5">{user.name} として投稿</p>}
        </div>

        <div className="rounded-xl bg-bt-gold/10 border border-bt-gold/40 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <p className="font-bold">今日の日報はすでに投稿済みです</p>
          </div>
          <p className="text-sm text-bt-dark/60 whitespace-pre-wrap line-clamp-3">
            {existingReport?.content}
          </p>
          <p className="text-xs text-bt-dark/40">
            投稿日時: {new Date(existingReport?.createdAt ?? '').toLocaleString('ja-JP')}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-lg border border-bt-dark/20 py-3 font-medium text-bt-dark/60 hover:bg-bt-dark/5 transition-colors"
          >
            戻る
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex-1 rounded-lg bg-bt-gold py-3 font-bold text-bt-dark hover:brightness-105 transition-all"
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
        <h1 className="text-2xl font-bold">
          {isEditMode ? '日報を修正' : '日報を投稿'}
        </h1>
        {user && <p className="text-sm text-bt-dark/50 mt-0.5">{user.name} として投稿</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 日時 */}
        <div className="rounded-xl bg-white shadow-sm border border-bt-dark/5 px-5 py-4">
          <label htmlFor="post-datetime" className="block text-sm font-medium mb-2 text-bt-dark/70">📅 日時</label>
          <input
            id="post-datetime"
            type="datetime-local"
            aria-label="日報の日時"
            value={reportedAt}
            onChange={(e) => setReportedAt(e.target.value)}
            className="w-full rounded-lg border border-bt-dark/15 px-3 py-2 text-sm outline-none focus:border-bt-gold"
          />
          {!isEditMode && (
            <p className="text-xs text-bt-dark/40 mt-1.5">
              過去の業務についても遡って投稿できます
            </p>
          )}
        </div>

        {/* 本文 */}
        <div className="rounded-xl bg-white shadow-sm border border-bt-dark/5 overflow-hidden">
          <label htmlFor="post-content" className="block px-5 pt-4 text-sm font-medium text-bt-dark/70">📝 内容</label>
          <textarea
            id="post-content"
            aria-label="日報の本文"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={`今日やったこと、気づいたこと、ホウレンソウを書こう\n\n例:\n・○○機能の実装が完了\n・△△さんとDB設計をレビュー\n・来週は□□を予定`}
            className="w-full resize-none px-5 pt-2 pb-4 text-sm leading-relaxed outline-none"
            rows={10}
          />
          <div className="flex justify-end border-t border-bt-dark/5 px-5 py-2 bg-bt-dark/[0.02]">
            <span
              className={`text-xs font-mono ${
                content.length >= MAX_LENGTH ? 'text-red-500' : 'text-bt-dark/40'
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
            className="flex-1 rounded-lg border border-bt-dark/20 py-3 font-medium text-bt-dark/60 hover:bg-bt-dark/5 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex-1 rounded-lg bg-bt-gold py-3 font-bold text-bt-dark disabled:opacity-40 hover:brightness-105 transition-all"
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
