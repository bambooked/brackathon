// ============================================================
// 見えない業務の見える化ページ
// 「あの人がこんないいことをしてた！」を書き込む → AIが判定してPT付与
// 【先輩への受け渡しメモ】
//   - handleSubmit 内を POST /invisible-tasks に差し替え
//   - リクエストボディ: { targetUserId, content, anonymous: boolean }
//   - fetchMyIncomingReports() → GET /invisible-tasks?targetUserId=me
//   - SAMPLE_* はモックデータ。接続後に削除してください。
//   - AI判定結果 (ptAwarded) はバックエンドから返す想定
// ============================================================
import { useState } from 'react'

// ---- サンプルデータ ----
const MY_USER_ID = 'u-001' // TODO(api): useAuth() の user.id に差し替え
const MY_NAME = '山田太郎'  // TODO(api): useAuth() の user.name に差し替え

const SAMPLE_MEMBERS = [
  { id: 'u-002', name: '鈴木花子' },
  { id: 'u-003', name: '田中一郎' },
  { id: 'u-004', name: '佐藤美咲' },
]

interface InvisibleTaskRecord {
  id: string
  targetUserId: string
  targetName: string
  content: string
  ptAwarded: number
  reportedAt: string
  reporterName: string | null // null = 匿名
}

// 自分宛のサンプル報告
const SAMPLE_MY_INCOMING: InvisibleTaskRecord[] = [
  {
    id: 'it-101',
    targetUserId: MY_USER_ID,
    targetName: MY_NAME,
    content: 'テスト環境のセットアップをドキュメント化してくれていた。新しいメンバーが入ったときにすごく助かった。',
    ptAwarded: 4,
    reportedAt: '2026-06-06T10:00:00+09:00',
    reporterName: '鈴木花子',
  },
  {
    id: 'it-102',
    targetUserId: MY_USER_ID,
    targetName: MY_NAME,
    content: 'レビューを頼んでないのにコードのリファクタリング案を提示してくれた。おかげでコードが全体的にきれいになった。',
    ptAwarded: 5,
    reportedAt: '2026-06-05T14:00:00+09:00',
    reporterName: null,
  },
  {
    id: 'it-103',
    targetUserId: MY_USER_ID,
    targetName: MY_NAME,
    content: 'CI/CDのパイプラインが壊れたとき、業務外の時間に直してくれていた。次の日の朝に気づいたらもう直ってた。',
    ptAwarded: 3,
    reportedAt: '2026-06-04T09:00:00+09:00',
    reporterName: '田中一郎',
  },
]
// ---- サンプルデータここまで ----

const MAX_LENGTH = 300

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ja-JP', {
    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface AiResult {
  targetName: string
  ptAwarded: number
}

export default function InvisibleTaskPage() {
  const [targetUserId, setTargetUserId] = useState(SAMPLE_MEMBERS[0].id)
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  // 自分宛の報告履歴（新着投稿を先頭に追加）
  const [myIncoming, setMyIncoming] = useState<InvisibleTaskRecord[]>(SAMPLE_MY_INCOMING)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setAiResult(null)
    try {
      // TODO(api): POST /invisible-tasks { targetUserId, content, anonymous } に差し替え
      await new Promise((r) => setTimeout(r, 1200))
      const target = SAMPLE_MEMBERS.find((m) => m.id === targetUserId)!
      const mockPt = Math.floor(Math.random() * 4) + 2
      const newRecord: InvisibleTaskRecord = {
        id: `it-${Date.now()}`,
        targetUserId,
        targetName: target.name,
        content,
        ptAwarded: mockPt,
        reportedAt: new Date().toISOString(),
        reporterName: anonymous ? null : MY_NAME,
      }
      // 自分宛の場合のみ自分の受信履歴にも追加（モック挙動）
      if (targetUserId === MY_USER_ID) {
        setMyIncoming((prev) => [newRecord, ...prev])
      }
      setAiResult({ targetName: target.name, ptAwarded: mockPt })
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-bt-cream">見えない業務の見える化 🔍</h1>
        <p className="text-sm text-bt-gray-dark mt-1">
          チームメンバーの「誰も気づいていないがんばり」を書き込もう。
          AIが内容を判定してその人にPTを付与します。
        </p>
      </div>

      {/* 投稿フォーム */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl bg-bt-card p-5 shadow-lg shadow-bt-black/50 border border-bt-thunder/20"
      >
        <div>
          <label htmlFor="target-member" className="block text-sm font-medium mb-1 text-bt-gray">誰のことを書く？</label>
          <select
            id="target-member"
            aria-label="対象メンバー"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream p-2.5 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all"
          >
            {SAMPLE_MEMBERS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="invisible-content" className="block text-sm font-medium mb-1 text-bt-gray">どんなことをしてた？</label>
          <textarea
            id="invisible-content"
            aria-label="見えない業務の内容"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={`例:\n・MTGの議事録を毎回丁寧にまとめてくれていた\n・誰も頼んでないのにコードレビューをしてくれていた\n・新メンバーのフォローを自主的にやってくれていた`}
            className="w-full resize-none rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream p-3 text-sm leading-relaxed outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all placeholder:text-bt-gray-dark"
            rows={5}
          />
          <p className="text-right text-xs text-bt-gray-dark mt-1">{content.length} / {MAX_LENGTH}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-bt-thunder/20 bg-bt-black/20 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-bt-cream">匿名で送る</p>
            <p className="text-xs text-bt-gray-dark mt-0.5">
              {anonymous ? '報告者名は「匿名さん」として表示されます' : `「${MY_NAME}」として表示されます`}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="匿名送信"
            aria-checked={anonymous}
            onClick={() => setAnonymous((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${anonymous ? 'bg-bt-thunder' : 'bg-bt-gray-dark/40'}`}
          >
            <span className={`inline-block h-5 w-5 rounded-full bg-bt-cream shadow transition-transform mt-0.5 ${anonymous ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="w-full rounded-lg bg-bt-thunder py-3 font-bold text-bt-black disabled:opacity-40 hover:bg-bt-gold-bright transition-all shadow-lg shadow-bt-thunder/30"
        >
          {submitting ? '🤖 AIが判定中...' : '送信してPTを贈る ⚡'}
        </button>
      </form>

      {/* AI判定結果 */}
      {aiResult && (
        <div className="rounded-xl bg-bt-thunder/20 border-2 border-bt-thunder p-5 flex items-start gap-4 shadow-lg shadow-bt-thunder/20">
          <span className="text-3xl">🤖</span>
          <div>
            <p className="font-bold text-bt-thunder">AIが判定しました！</p>
            <p className="text-sm text-bt-cream mt-1">
              <span className="font-semibold">{aiResult.targetName}</span> さんに{' '}
              <span className="text-lg font-bold text-bt-thunder">+{aiResult.ptAwarded} PT</span> を付与しました
            </p>
          </div>
        </div>
      )}

      {/* 自分への報告 */}
      <section>
        <h2 className="font-bold text-bt-thunder text-sm uppercase tracking-wide mb-3">
          自分への報告 🎉
        </h2>
        {myIncoming.length === 0 ? (
          <p className="text-center text-bt-gray-dark text-sm py-6">まだ報告はありません</p>
        ) : (
          <ul className="space-y-3">
            {myIncoming.map((record) => (
              <li key={record.id} className="rounded-xl bg-bt-card p-4 shadow-lg shadow-bt-black/50 border border-bt-thunder/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-bt-thunder/20 px-2 py-0.5 text-xs font-bold text-bt-thunder">
                      +{record.ptAwarded} PT
                    </span>
                    <span className="text-xs text-bt-gray-dark">
                      {record.reporterName ?? '匿名さん'} より
                    </span>
                  </div>
                  <span className="text-xs text-bt-gray-dark">{formatDate(record.reportedAt)}</span>
                </div>
                <p className="text-sm text-bt-gray leading-relaxed">{record.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
