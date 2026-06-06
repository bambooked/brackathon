import { useEffect, useMemo, useState } from 'react'

import { addReaction, fetchAllReports, fetchReports, removeReaction } from '@/api/reports'
import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types'

const REACTION_EMOJIS = ['⚡', '👍', '🔥', '🙏']

const AVATAR_COLORS = [
  'bg-amber-400 text-amber-900',
  'bg-sky-400 text-sky-900',
  'bg-emerald-400 text-emerald-900',
  'bg-rose-400 text-rose-900',
  'bg-violet-400 text-violet-900',
]
function avatarColor(id: string) {
  let hash = 0
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xff
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function todayString(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function dateKey(iso: string) { return iso.slice(0, 10) }
function monthKey(iso: string) { return iso.slice(0, 7) }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
}
function formatCardDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
}
function formatChipLabel(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return { md: `${d.getMonth() + 1}/${d.getDate()}`, wd: weekdays[d.getDay()] }
}
function formatMonthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return `${y}年${parseInt(m)}月`
}

function buildMonths(reports: Report[], today: string): string[] {
  if (reports.length === 0) return [today.slice(0, 7)]
  const months = reports.map((r) => monthKey(r.createdAt))
  const earliest = [...months].sort()[0]
  const todayMonth = today.slice(0, 7)
  const result: string[] = []
  let cur = todayMonth
  while (cur >= earliest) {
    result.push(cur)
    const [y, m] = cur.split('-').map(Number)
    cur = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  }
  return result
}

type TopTab = 'feed' | 'person'
type PersonTab = 'today' | 'all'

interface ReportCardProps {
  report: Report
  currentUserId: string | undefined
  onReact: (reportId: string, emoji: string) => void
  onSelectAuthor?: (authorId: string, authorName: string) => void
  showDate?: boolean
}

function ReportCard({ report, currentUserId, onReact, onSelectAuthor, showDate = false }: ReportCardProps) {
  const color = avatarColor(report.authorId)
  const isOwn = report.authorId === currentUserId
  return (
    <li className="rounded-xl bg-white shadow-sm border border-bt-dark/5 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-bt-dark/5 bg-bt-dark/[0.02]">
        <button
          onClick={() => onSelectAuthor?.(report.authorId, report.authorName)}
          disabled={!onSelectAuthor}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-bold ${color} ${onSelectAuthor ? 'hover:ring-2 hover:ring-bt-gold transition-all cursor-pointer' : ''}`}
          aria-label={onSelectAuthor ? `${report.authorName}の日報を見る` : undefined}
        >
          {report.authorName[0]}
        </button>
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onSelectAuthor?.(report.authorId, report.authorName)}
            disabled={!onSelectAuthor}
            className={`text-base font-bold leading-tight ${onSelectAuthor ? 'hover:text-bt-gold transition-colors cursor-pointer' : ''}`}
          >
            {report.authorName}
          </button>
          <p className="text-xs text-bt-dark/40 mt-0.5">
            {showDate ? formatCardDate(report.createdAt) : formatTime(report.createdAt)}
          </p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-bt-dark/80">{report.content}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap px-5 pb-4">
        {REACTION_EMOJIS.map((emoji) => {
          const count = report.reactions.filter((r) => r.emoji === emoji).length
          const reacted = report.reactions.some((r) => r.emoji === emoji && r.userId === currentUserId)
          return (
            <button
              key={emoji}
              onClick={() => onReact(report.id, emoji)}
              disabled={isOwn}
              title={isOwn ? '自分の日報にはリアクションできません' : undefined}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors
                ${isOwn ? 'opacity-40 cursor-not-allowed border-bt-dark/10' :
                  reacted ? 'border-bt-gold bg-bt-gold/20 font-semibold' :
                  count > 0 ? 'border-bt-gold bg-bt-gold/10 font-semibold' :
                  'border-bt-dark/15 hover:border-bt-gold hover:bg-bt-gold/5'}`}
            >
              {emoji}
              {count > 0 && <span className="text-xs font-bold">{count}</span>}
            </button>
          )
        })}
      </div>
    </li>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const TODAY = todayString()

  const [topTab, setTopTab] = useState<TopTab>('feed')
  const [todayReports, setTodayReports] = useState<Report[]>([])
  const [archiveReports, setArchiveReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null)
  const [selectedAuthorName, setSelectedAuthorName] = useState<string | null>(null)
  const [personTab, setPersonTab] = useState<PersonTab>('today')

  const [selectedMonth, setSelectedMonth] = useState<string>(TODAY.slice(0, 7))
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchReports({ date: TODAY }),
      fetchAllReports(),
    ])
      .then(([today, all]) => {
        setTodayReports(today)
        // all には今日含む全件が返るので今日分を除いてアーカイブとする
        setArchiveReports(all.filter((r) => dateKey(r.createdAt) !== TODAY))
      })
      .catch(() => {/* エラー時は空のまま */})
      .finally(() => setLoading(false))
  }, [TODAY])

  const allMonths = useMemo(() => buildMonths(archiveReports, TODAY), [archiveReports, TODAY])

  const currentMonthIdx = allMonths.indexOf(selectedMonth)

  const archiveDatesOfMonth = useMemo(() => {
    const dates = Array.from(new Set(
      archiveReports
        .filter((r) => monthKey(r.createdAt) === selectedMonth)
        .map((r) => dateKey(r.createdAt))
    )).sort((a, b) => b.localeCompare(a))
    return dates
  }, [archiveReports, selectedMonth])

  const archiveDayReports = useMemo(() => {
    if (!selectedArchiveDate) return []
    return archiveReports.filter((r) => dateKey(r.createdAt) === selectedArchiveDate)
  }, [archiveReports, selectedArchiveDate])

  const allReports = useMemo(() => [...todayReports, ...archiveReports], [todayReports, archiveReports])

  const allAuthors = useMemo(() =>
    Array.from(new Map(allReports.map((r) => [r.authorId, r.authorName])).entries())
      .map(([id, name]) => ({ id, name })),
    [allReports]
  )

  const personReports = useMemo(() => {
    if (!selectedAuthorId) return []
    const base = allReports.filter((r) => r.authorId === selectedAuthorId)
    if (personTab === 'today') return base.filter((r) => dateKey(r.createdAt) === TODAY)
    return base.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [selectedAuthorId, personTab, allReports, TODAY])

  async function handleReact(reportId: string, emoji: string) {
    try {
      const report = [...todayReports, ...archiveReports].find((r) => r.id === reportId)
      const alreadyReacted = report?.reactions.some((r) => r.userId === user?.id && r.emoji === emoji) ?? false

      if (alreadyReacted) {
        await removeReaction(reportId, emoji)
        const updateList = (list: Report[]) =>
          list.map((r) =>
            r.id === reportId
              ? { ...r, reactions: r.reactions.filter((rx) => !(rx.userId === user?.id && rx.emoji === emoji)) }
              : r
          )
        setTodayReports((prev) => updateList(prev))
        setArchiveReports((prev) => updateList(prev))
      } else {
        const reaction = await addReaction(reportId, emoji)
        const updateList = (list: Report[]) =>
          list.map((r) =>
            r.id === reportId ? { ...r, reactions: [...r.reactions, reaction] } : r
          )
        setTodayReports((prev) => updateList(prev))
        setArchiveReports((prev) => updateList(prev))
      }
    } catch {
      // 自己リアクション等のエラーは無視（UIで既にdisabled）
    }
  }

  function enterPersonView(authorId: string, authorName: string) {
    setSelectedAuthorId(authorId)
    setSelectedAuthorName(authorName)
    setPersonTab('today')
    setTopTab('person')
  }

  function changeMonth(delta: number) {
    const next = allMonths[currentMonthIdx + delta]
    if (next) {
      setSelectedMonth(next)
      setSelectedArchiveDate(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-bt-dark/30">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* ===== トップタブ ===== */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl border border-bt-dark/10 overflow-hidden bg-white shadow-sm">
          {(['feed', 'person'] as TopTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setTopTab(tab)
                if (tab === 'feed') { setSelectedAuthorId(null); setSelectedAuthorName(null) }
              }}
              className={`px-5 py-2 text-sm font-medium transition-colors
                ${topTab === tab ? 'bg-bt-dark text-bt-cream' : 'hover:bg-bt-dark/5 text-bt-dark/60'}`}
            >
              {tab === 'feed' ? '📰 日報' : '🔍 人で探す'}
            </button>
          ))}
        </div>

        {topTab === 'feed' && (
          <p className="text-sm text-bt-dark/50">
            {new Date(TODAY).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
        )}
      </div>

      {/* ===== 人で探すタブ ===== */}
      {topTab === 'person' && (
        <div className="space-y-4">
          {!selectedAuthorId ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {allAuthors.map(({ id, name }) => {
                const postCount = allReports.filter((r) => r.authorId === id).length
                const color = avatarColor(id)
                return (
                  <button
                    key={id}
                    onClick={() => enterPersonView(id, name)}
                    className="flex flex-col items-center gap-2 rounded-xl bg-white border border-bt-dark/5 p-5 shadow-sm hover:border-bt-gold hover:shadow-md transition-all"
                  >
                    <span className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${color}`}>
                      {name[0]}
                    </span>
                    <p className="font-bold text-sm">{name}</p>
                    <p className="text-xs text-bt-dark/40">{postCount} 件の投稿</p>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${avatarColor(selectedAuthorId)}`}>
                    {selectedAuthorName?.[0]}
                  </span>
                  <div>
                    <p className="font-bold">{selectedAuthorName}さんの日報</p>
                    <p className="text-xs text-bt-dark/40">
                      {personTab === 'today' ? '今日の投稿' : '全期間の投稿'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAuthorId(null); setSelectedAuthorName(null) }}
                  className="rounded-full border border-bt-dark/20 px-3 py-1 text-xs text-bt-dark/60 hover:bg-bt-dark/5 transition-colors"
                >
                  ← 一覧に戻る
                </button>
              </div>

              <div className="flex rounded-xl border border-bt-dark/10 overflow-hidden bg-white shadow-sm w-fit">
                {(['today', 'all'] as PersonTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPersonTab(tab)}
                    className={`px-5 py-2 text-sm font-medium transition-colors
                      ${personTab === tab ? 'bg-bt-dark text-bt-cream' : 'hover:bg-bt-dark/5 text-bt-dark/60'}`}
                  >
                    {tab === 'today' ? '今日の投稿' : '全期間'}
                  </button>
                ))}
              </div>

              {personReports.length === 0 ? (
                <p className="text-center text-bt-dark/40 py-12">
                  {personTab === 'today' ? '今日の投稿はありません' : '投稿がありません'}
                </p>
              ) : (
                <ul className="space-y-4">
                  {personReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      currentUserId={user?.id}
                      onReact={handleReact}
                      showDate={personTab === 'all'}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== 日報タブ ===== */}
      {topTab === 'feed' && (
        <>
          {/* 今日の日報 */}
          <div>
            <p className="text-xs font-medium text-bt-dark/50 uppercase tracking-wide mb-3">今日の投稿</p>
            {todayReports.length === 0 ? (
              <p className="text-center text-bt-dark/40 py-8">まだ今日の日報はありません</p>
            ) : (
              <ul className="space-y-4">
                {todayReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    currentUserId={user?.id}
                    onReact={handleReact}
                    onSelectAuthor={enterPersonView}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* アーカイブ */}
          <div className="border-t border-bt-dark/10 pt-5 space-y-3">
            <p className="text-xs font-medium text-bt-dark/50 uppercase tracking-wide">過去の日報</p>

            {/* 年月ナビ */}
            <div className="flex items-center justify-between rounded-xl border border-bt-dark/10 bg-white px-4 py-2.5 shadow-sm">
              <button
                onClick={() => changeMonth(1)}
                disabled={currentMonthIdx >= allMonths.length - 1}
                aria-label="前の月"
                className="rounded-lg px-2 py-1 text-lg text-bt-dark/50 hover:bg-bt-dark/5 disabled:opacity-30 transition-colors"
              >
                ‹
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{formatMonthLabel(selectedMonth)}</span>
                {archiveDatesOfMonth.length > 0 && (
                  <span className="rounded-full bg-bt-gold/20 px-2 py-0.5 text-xs font-medium text-bt-dark/60">
                    {archiveReports.filter((r) => monthKey(r.createdAt) === selectedMonth).length} 件
                  </span>
                )}
              </div>
              <button
                onClick={() => changeMonth(-1)}
                disabled={currentMonthIdx <= 0}
                aria-label="次の月"
                className="rounded-lg px-2 py-1 text-lg text-bt-dark/50 hover:bg-bt-dark/5 disabled:opacity-30 transition-colors"
              >
                ›
              </button>
            </div>

            {/* 日付チップ */}
            {archiveDatesOfMonth.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {archiveDatesOfMonth.map((date) => {
                  const { md, wd } = formatChipLabel(date)
                  const isSelected = selectedArchiveDate === date
                  const dayCount = archiveReports.filter((r) => dateKey(r.createdAt) === date).length
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedArchiveDate((prev) => prev === date ? null : date)}
                      className={`relative flex shrink-0 flex-col items-center rounded-2xl px-4 py-2.5 transition-all
                        ${isSelected ? 'bg-bt-dark text-bt-cream shadow-md scale-105' : 'border border-bt-dark/15 bg-white hover:border-bt-dark/40'}`}
                    >
                      <span className={`text-base font-bold leading-tight ${isSelected ? '' : 'text-bt-dark'}`}>{md}</span>
                      <span className={`text-xs mt-0.5 ${isSelected ? 'text-bt-cream/70' : 'text-bt-dark/40'}`}>{wd}</span>
                      <span className={`mt-1 text-xs font-bold ${isSelected ? 'text-bt-cream/80' : 'text-bt-gold'}`}>{dayCount}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-bt-dark/30 text-sm py-4">この月の日報はありません</p>
            )}

            {/* 選択日の日報 */}
            {selectedArchiveDate && archiveDayReports.length > 0 && (
              <ul className="space-y-4 pt-1">
                {archiveDayReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    currentUserId={user?.id}
                    onReact={handleReact}
                    onSelectAuthor={enterPersonView}
                    showDate
                  />
                ))}
              </ul>
            )}

            {archiveDatesOfMonth.length > 0 && !selectedArchiveDate && (
              <p className="text-center text-bt-dark/30 text-sm py-3">日付を選んで日報を見る</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
