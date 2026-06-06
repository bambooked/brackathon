// ============================================================
// BTプレゼントページ — 他人に BT(ポイント) を渡す
// ============================================================
import { useState } from 'react'
import { sendPresent } from '@/api/points'

// TODO(api): チームメンバー一覧は GET /teams/:id/members から取得予定。
// 現状はダミー。接続時に差し替えてください。
const mockMembers = [
  { id: 'u-002', name: 'ユーザーA' },
  { id: 'u-003', name: '先輩A' },
]

export default function PresentPage() {
  const [toUserId, setToUserId] = useState(mockMembers[0].id)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    await sendPresent(toUserId, message)
    setSent(true)
    setMessage('')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">BTプレゼント ⚡</h1>
      <p className="text-sm text-bt-dark/60">頑張った仲間に BT を渡そう</p>

      <form onSubmit={handleSend} className="space-y-3">
        <select
          aria-label="送る相手"
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          className="w-full rounded border p-2"
        >
          {mockMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          aria-label="メッセージ"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="ひとことメッセージ (任意)"
          className="w-full rounded border p-2"
        />
        <button type="submit" className="rounded bg-bt-gold px-4 py-2 font-bold text-bt-dark">
          渡す
        </button>
      </form>

      {sent && <p className="text-green-600">BTを渡しました！</p>}
    </div>
  )
}
