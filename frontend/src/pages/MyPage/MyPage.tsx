import { useEffect, useState } from 'react'

import { updateProfile } from '@/api/auth'
import { fetchMyPoints, fetchPointHistory } from '@/api/points'
import { fetchReports } from '@/api/reports'
import { useAuth } from '@/contexts/AuthContext'
import type { PointTransaction, Report } from '@/types'

// フォールバック用サンプルデータ（API 接続前やロード中に表示）
const SAMPLE_MY_POINTS = 23

const SAMPLE_POINT_HISTORY: PointTransaction[] = [
  { id: 'pt-001', userId: 'u-001', amount: 3, reason: 'invisible_task', createdAt: '2026-06-06T09:50:00+09:00' },
  { id: 'pt-002', userId: 'u-001', amount: 1, reason: 'report_reaction', createdAt: '2026-06-05T14:20:00+09:00' },
  { id: 'pt-003', userId: 'u-001', amount: 1, reason: 'report_reaction', createdAt: '2026-06-05T11:00:00+09:00' },
  { id: 'pt-004', userId: 'u-001', amount: -1, reason: 'present', createdAt: '2026-06-04T16:30:00+09:00' },
  { id: 'pt-005', userId: 'u-001', amount: 2, reason: 'invisible_task', createdAt: '2026-06-04T10:05:00+09:00' },
]

const SAMPLE_MY_REPORTS: Report[] = [
  {
    id: 'r-012', authorId: 'u-001', authorName: '山田太郎',
    content: 'フロントのコンポーネント設計をまとめた。Atomic Designで整理する方向で進めることにした。明日チームに共有予定。',
    createdAt: '2026-06-04T17:00:00+09:00',
    reactions: [
      { id: 'rx-013', userId: 'u-003', emoji: '👍' },
      { id: 'rx-014', userId: 'u-004', emoji: '⚡' },
      { id: 'rx-015', userId: 'u-002', emoji: '🔥' },
    ],
  },
  {
    id: 'r-020', authorId: 'u-001', authorName: '山田太郎',
    content: 'スプリント計画のタスク分解を実施。見積もりに時間がかかったが、チームの認識が揃った。',
    createdAt: '2026-06-03T18:00:00+09:00',
    reactions: [{ id: 'rx-020', userId: 'u-002', emoji: '🙏' }],
  },
  {
    id: 'r-030', authorId: 'u-001', authorName: '山田太郎',
    content: 'Vitestの導入と初期テスト設定を完了。CI連携まで完了。テストカバレッジ計測もできるようになった。',
    createdAt: '2026-06-02T15:45:00+09:00',
    reactions: [
      { id: 'rx-030', userId: 'u-003', emoji: '⚡' },
      { id: 'rx-031', userId: 'u-004', emoji: '⚡' },
    ],
  },
]

const REASON_LABEL: Record<string, string> = {
  report_reaction: 'リアクションをもらった',
  invisible_task: '見えない業務を見える化 (AI)',
  present: 'BTプレゼントを送った',
  bt_time: 'BTtimeを開催',
  bt_fever: 'BTfeverを開催',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function MyPage() {
  const { user } = useAuth()

  const [name, setName] = useState(user?.name ?? '山田太郎')
  const [nickname, setNickname] = useState('')
  const [showNickname, setShowNickname] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const [myPoints, setMyPoints] = useState(SAMPLE_MY_POINTS)
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>(SAMPLE_POINT_HISTORY)
  const [myReports, setMyReports] = useState<Report[]>(SAMPLE_MY_REPORTS)
  const [archiveOpen, setArchiveOpen] = useState(false)

  useEffect(() => {
    fetchMyPoints().then(setMyPoints).catch(() => {/* フォールバック */})
    fetchPointHistory().then(setPointHistory).catch(() => {/* フォールバック */})
    if (user) {
      fetchReports({ userId: user.id }).then(setMyReports).catch(() => {/* フォールバック */})
    }
  }, [user])

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileSaved(false)
    try {
      await updateProfile({ name, nickname: nickname || undefined, use_nickname: showNickname })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2500)
    } catch {
      /* エラー時はサイレント */
    } finally {
      setProfileSaving(false)
    }
  }

  const displayName = showNickname && nickname.trim() ? nickname : name

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-bt-cream">マイページ</h1>

      {/* プロフィール設定 */}
      <section
        className="rounded-xl shadow-lg shadow-bt-black/50 overflow-hidden p-3 border-4 border-bt-thunder"
        style={{
          backgroundImage: 'url(/blackthunder.png)',
          backgroundSize: '130% 130%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-bt-thunder/20">
            <h2 className="font-bold text-bt-cream text-sm uppercase tracking-wide">プロフィール</h2>
          </div>
          <form onSubmit={handleProfileSave} className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bt-thunder text-2xl font-bold text-bt-black">
                {displayName[0]}
              </span>
              <div>
                <p className="font-bold text-lg text-bt-cream">{displayName}</p>
                <p className="text-xs text-bt-gray">
                  {showNickname ? 'ニックネームで表示中' : '本名で表示中'}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium mb-1 text-bt-gray">本名</label>
              <input
                id="profile-name"
                aria-label="本名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream px-3 py-2 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="profile-nickname" className="block text-sm font-medium mb-1 text-bt-gray">ニックネーム</label>
              <input
                id="profile-nickname"
                aria-label="ニックネーム"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="任意"
                className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream px-3 py-2 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all placeholder:text-bt-gray-dark"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-bt-thunder/30 bg-bt-black/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-bt-cream">ニックネームで表示する</p>
                <p className="text-xs text-bt-gray mt-0.5">
                  ONにすると日報やリアクションにニックネームが表示されます
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showNickname}
                onClick={() => setShowNickname((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors
                  ${showNickname ? 'bg-bt-thunder' : 'bg-gray-300'}`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5
                    ${showNickname ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={profileSaving}
                className="rounded-lg bg-bt-thunder px-5 py-2 text-sm font-bold text-bt-black disabled:opacity-50 hover:bg-bt-gold-bright transition-all shadow-lg shadow-bt-thunder/30"
              >
                {profileSaving ? '保存中...' : '保存する'}
              </button>
              {profileSaved && (
                <span className="text-sm text-bt-thunder font-medium">✓ 保存しました</span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* ポイント残高 */}
      <section
        className="rounded-xl shadow-lg shadow-bt-black/50 overflow-hidden p-3 border-4 border-bt-thunder"
        style={{
          backgroundImage: 'url(/blackthunder.png)',
          backgroundSize: '130% 130%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="rounded-lg p-5">
          <h2 className="font-bold text-bt-cream text-sm uppercase tracking-wide mb-3">ポイント</h2>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-bt-thunder animate-pulse-thunder">{myPoints}</span>
            <span className="mb-1 text-lg font-medium text-bt-gray">PT</span>
          </div>
        </div>
      </section>

      {/* ポイント履歴 */}
      <section
        className="rounded-xl shadow-lg shadow-bt-black/50 overflow-hidden p-3 border-4 border-bt-thunder"
        style={{
          backgroundImage: 'url(/blackthunder.png)',
          backgroundSize: '130% 130%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="rounded-lg p-5">
          <h2 className="font-bold text-bt-cream text-sm uppercase tracking-wide mb-3">
            ポイント履歴
          </h2>
          <ul className="divide-y divide-bt-thunder/20">
            {pointHistory.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-bt-cream">{REASON_LABEL[tx.reason] ?? tx.reason}</p>
                  <p className="text-xs text-bt-gray">{formatDate(tx.createdAt)}</p>
                </div>
                <span className={`text-base font-bold ${tx.amount > 0 ? 'text-bt-thunder' : 'text-red-400'}`}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} PT
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 自分の日報アーカイブ */}
      <section className="border-t border-bt-thunder/20 pt-4">
        <button
          onClick={() => setArchiveOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-2 text-sm font-medium text-bt-gray hover:text-bt-thunder transition-colors"
        >
          <span>📂 自分の日報アーカイブ ({myReports.length} 件)</span>
          <span className="text-lg">{archiveOpen ? '▲' : '▼'}</span>
        </button>

        {archiveOpen && (
          <ul className="mt-3 space-y-3">
            {myReports.map((report) => (
              <li
                key={report.id}
                className="rounded-xl shadow-lg shadow-bt-black/50 overflow-hidden p-3 border-4 border-bt-thunder"
                style={{
                  backgroundImage: 'url(/blackthunder.png)',
                  backgroundSize: '130% 130%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <div className="rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-bt-gray">{formatDate(report.createdAt)}</span>
                    <span className="text-xs bg-bt-thunder/20 text-bt-thunder rounded-full px-2 py-0.5">
                      リアクション {report.reactions.length}件
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-bt-cream whitespace-pre-wrap">
                    {report.content}
                  </p>
                  {report.reactions.length > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {report.reactions.map((r) => (
                        <span key={r.id} className="text-base">{r.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
