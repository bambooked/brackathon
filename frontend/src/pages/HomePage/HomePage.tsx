// ============================================================
// ホーム画面
//   「日報」タブ    — 今日の日報 + 全期間アーカイブ(年月ナビ + 日付チップ)
//   「人で探す」タブ — メンバー選択 → パーソンビュー(今日/全期間)
// 【先輩への受け渡しメモ】
//   - fetchReports() / addReaction() は api/reports.ts 経由に差し替え
//   - fetchReportsByAuthor(authorId) は api/reports.ts に追加予定
//   - SAMPLE_* 定数はモックデータ。接続後に削除してください。
// ============================================================
import { useMemo, useState } from 'react'

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

// ---- サンプルデータ ----
const TODAY = '2026-06-06'

const SAMPLE_TODAY_REPORTS: Report[] = [
  {
    id: 'r-001', authorId: 'u-002', authorName: '鈴木花子',
    content: '今日はログイン画面のリファクタリングを進めました。バリデーション周りを整理して、エラーメッセージをわかりやすくしました。明日はテストを追加する予定です。',
    createdAt: `${TODAY}T09:45:00+09:00`,
    reactions: [
      { id: 'rx-001', userId: 'u-001', emoji: '👍' },
      { id: 'rx-002', userId: 'u-003', emoji: '⚡' },
    ],
  },
  {
    id: 'r-002', authorId: 'u-003', authorName: '田中一郎',
    content: 'バックエンドのDB設計レビューに参加しました。インデックス周りで議論があり、最終的にcomposite indexを追加する方針になりました。ドキュメントも更新済みです。',
    createdAt: `${TODAY}T11:20:00+09:00`,
    reactions: [{ id: 'rx-003', userId: 'u-002', emoji: '🙏' }],
  },
  {
    id: 'r-003', authorId: 'u-004', authorName: '佐藤美咲',
    content: 'チームMTGの議事録をまとめました。来週のスプリント計画も共有済み。先週積み残しになっていたCSRF対策の実装も完了しました！',
    createdAt: `${TODAY}T14:05:00+09:00`,
    reactions: [],
  },
]

const SAMPLE_ARCHIVE_REPORTS: Report[] = [
  // 6/5
  { id: 'r-010', authorId: 'u-002', authorName: '鈴木花子', content: '認証フローの設計をチームでレビュー。JWT vs セッションで議論。来週中に実装方針決定予定。', createdAt: '2026-06-05T10:00:00+09:00', reactions: [{ id: 'rx-010', userId: 'u-001', emoji: '⚡' }] },
  { id: 'r-011', authorId: 'u-003', authorName: '田中一郎', content: 'APIエンドポイントの整理とSwaggerドキュメント更新。/v1プレフィックス統一が完了しました。', createdAt: '2026-06-05T15:30:00+09:00', reactions: [{ id: 'rx-012', userId: 'u-002', emoji: '🔥' }] },
  { id: 'r-014', authorId: 'u-001', authorName: '山田太郎', content: 'Vitestのカバレッジ設定を整えた。カバレッジ70%超え達成。Dockerfileをマルチステージビルドに変更した。', createdAt: '2026-06-05T17:00:00+09:00', reactions: [{ id: 'rx-017', userId: 'u-003', emoji: '⚡' }] },
  // 6/4
  { id: 'r-012', authorId: 'u-001', authorName: '山田太郎', content: 'フロントのコンポーネント設計をまとめた。Atomic Designで整理する方向で進めることにした。明日チームに共有予定。', createdAt: '2026-06-04T17:00:00+09:00', reactions: [{ id: 'rx-013', userId: 'u-003', emoji: '👍' }, { id: 'rx-014', userId: 'u-004', emoji: '⚡' }] },
  { id: 'r-013', authorId: 'u-004', authorName: '佐藤美咲', content: 'E2Eテスト環境をPlaywrightで構築。基本的なログインフローのテストが通るようになった。', createdAt: '2026-06-04T14:30:00+09:00', reactions: [{ id: 'rx-016', userId: 'u-001', emoji: '⚡' }] },
  // 6/3
  { id: 'r-020', authorId: 'u-002', authorName: '鈴木花子', content: 'スプリントレビューの準備。デモ環境のセットアップに手間取ったけど完了。明日のレビューに間に合った。', createdAt: '2026-06-03T16:00:00+09:00', reactions: [{ id: 'rx-020', userId: 'u-001', emoji: '🙏' }] },
  { id: 'r-021', authorId: 'u-003', authorName: '田中一郎', content: 'パフォーマンス改善に着手。N+1クエリを3箇所修正してAPIレスポンスが約40%改善した。', createdAt: '2026-06-03T18:00:00+09:00', reactions: [{ id: 'rx-022', userId: 'u-004', emoji: '⚡' }] },
  // 5/30
  { id: 'r-030', authorId: 'u-002', authorName: '鈴木花子', content: '5月末のリリース対応。ホットフィックスを2件マージしてデプロイ完了。本番環境での動作を確認した。', createdAt: '2026-05-30T19:00:00+09:00', reactions: [{ id: 'rx-030', userId: 'u-001', emoji: '🔥' }] },
  { id: 'r-031', authorId: 'u-004', authorName: '佐藤美咲', content: '5月の振り返りドキュメントを作成。来月のOKR案も一緒にまとめてチームに共有した。', createdAt: '2026-05-29T17:00:00+09:00', reactions: [{ id: 'rx-031', userId: 'u-003', emoji: '👍' }] },
  { id: 'r-032', authorId: 'u-001', authorName: '山田太郎', content: 'フロント側のバンドルサイズを最適化。動的インポート導入でLCP改善。Lighthouseスコアが85→94になった。', createdAt: '2026-05-28T15:00:00+09:00', reactions: [{ id: 'rx-032', userId: 'u-002', emoji: '⚡' }] },
]
// ---- サンプルデータここまで ----

const ALL_REPORTS = [...SAMPLE_TODAY_REPORTS, ...SAMPLE_ARCHIVE_REPORTS]

// 全チームメンバー（パーソン選択画面用）
const ALL_AUTHORS = Array.from(
  new Map(ALL_REPORTS.map((r) => [r.authorId, r.authorName])).entries()
).map(([id, name]) => ({ id, name }))

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

/** 最古のアーカイブ月〜今月の全月リストを降順で生成 */
function buildAllMonths(): string[] {
  const archiveMonths = SAMPLE_ARCHIVE_REPORTS.map((r) => monthKey(r.createdAt))
  const earliest = [...archiveMonths].sort()[0] // "2026-05" など
  const todayMonth = monthKey(`${TODAY}T00:00:00+09:00`)
  const months: string[] = []
  let cur = todayMonth
  while (cur >= earliest) {
    months.push(cur)
    const [y, m] = cur.split('-').map(Number)
    cur = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`
  }
  return months
}

/** その月のアーカイブ日付リスト（降順）と件数 */
function getMonthData(ym: string) {
  const reports = SAMPLE_ARCHIVE_REPORTS.filter((r) => monthKey(r.createdAt) === ym)
  const dates = Array.from(new Set(reports.map((r) => dateKey(r.createdAt)))).sort((a, b) => b.localeCompare(a))
  return { dates, count: reports.length }
}

const ALL_MONTHS = buildAllMonths()

type TopTab = 'feed' | 'person'
type PersonTab = 'today' | 'all'

interface ReportCardProps {
  report: Report
  onReact: (reportId: string, emoji: string) => void
  onSelectAuthor?: (authorId: string, authorName: string) => void
  showDate?: boolean
}

function ReportCard({ report, onReact, onSelectAuthor, showDate = false }: ReportCardProps) {
  const color = avatarColor(report.authorId)
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
          return (
            <button
              key={emoji}
              onClick={() => onReact(report.id, emoji)}
              className={`flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors
                ${count > 0 ? 'border-bt-gold bg-bt-gold/10 font-semibold' : 'border-bt-dark/15 hover:border-bt-gold hover:bg-bt-gold/5'}`}
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
  const [topTab, setTopTab] = useState<TopTab>('feed')
  const [todayReports, setTodayReports] = useState<Report[]>(SAMPLE_TODAY_REPORTS)

  // パーソンビュー
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null)
  const [selectedAuthorName, setSelectedAuthorName] = useState<string | null>(null)
  const [personTab, setPersonTab] = useState<PersonTab>('today')

  // アーカイブ
  const [selectedMonth, setSelectedMonth] = useState(ALL_MONTHS[0])
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string | null>(null)

  const currentMonthIdx = ALL_MONTHS.indexOf(selectedMonth)
  const { dates: archiveDatesOfMonth, count: monthCount } = useMemo(
    () => getMonthData(selectedMonth),
    [selectedMonth],
  )

  const archiveDayReports = useMemo(() => {
    if (!selectedArchiveDate) return []
    return SAMPLE_ARCHIVE_REPORTS.filter((r) => dateKey(r.createdAt) === selectedArchiveDate)
  }, [selectedArchiveDate])

  const personReports = useMemo(() => {
    if (!selectedAuthorId) return []
    const base = ALL_REPORTS.filter((r) => r.authorId === selectedAuthorId)
    if (personTab === 'today') return base.filter((r) => dateKey(r.createdAt) === TODAY)
    return base.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [selectedAuthorId, personTab])

  function handleReact(reportId: string, emoji: string) {
    setTodayReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, reactions: [...r.reactions, { id: `rx-${Date.now()}`, userId: 'u-001', emoji }] }
          : r,
      ),
    )
  }

  function enterPersonView(authorId: string, authorName: string) {
    setSelectedAuthorId(authorId)
    setSelectedAuthorName(authorName)
    setPersonTab('today')
    setTopTab('person')
  }

  function changeMonth(delta: number) {
    const next = ALL_MONTHS[currentMonthIdx + delta]
    if (next) {
      setSelectedMonth(next)
      setSelectedArchiveDate(null)
    }
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
            /* メンバー選択グリッド */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ALL_AUTHORS.map(({ id, name }) => {
                const postCount = ALL_REPORTS.filter((r) => r.authorId === id).length
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
            /* パーソンビュー */
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

              {/* 今日/全期間タブ */}
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
                    <ReportCard key={report.id} report={report} onReact={handleReact} showDate={personTab === 'all'} />
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
                disabled={currentMonthIdx >= ALL_MONTHS.length - 1}
                aria-label="前の月"
                className="rounded-lg px-2 py-1 text-lg text-bt-dark/50 hover:bg-bt-dark/5 disabled:opacity-30 transition-colors"
              >
                ‹
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{formatMonthLabel(selectedMonth)}</span>
                {monthCount > 0 && (
                  <span className="rounded-full bg-bt-gold/20 px-2 py-0.5 text-xs font-medium text-bt-dark/60">
                    {monthCount} 件
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
                  const dayCount = SAMPLE_ARCHIVE_REPORTS.filter((r) => dateKey(r.createdAt) === date).length
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
                    onReact={() => {}}
                    onSelectAuthor={enterPersonView}
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
