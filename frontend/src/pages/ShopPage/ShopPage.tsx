// ============================================================
// BTショップ — ポイントを消費してブラックサンダーを使ったイベントを発動
// 【先輩への受け渡しメモ】
//   - sendPresent() は api/points.ts 経由に差し替え
//   - startEvent() は api/points.ts 経由に差し替え
//   - fetchTeamMembers() は GET /teams/:id/members に対応予定
//   - SAMPLE_* はモックデータ。接続後に削除してください。
// ============================================================
import { useState } from 'react'

import { type BTEvent,POINT_COST } from '@/types'

// ---- サンプルデータ ----
const SAMPLE_MY_POINTS = 23

const SAMPLE_MEMBERS = [
  { id: 'u-002', name: '鈴木花子' },
  { id: 'u-003', name: '田中一郎' },
  { id: 'u-004', name: '佐藤美咲' },
]
// ---- サンプルデータここまで ----

const SHOP_ITEMS = [
  {
    id: 'present',
    icon: '🍫',
    title: 'BTプレゼント',
    description: '頑張った仲間にブラックサンダーを1個プレゼント',
    cost: POINT_COST.PRESENT,
    type: 'present' as const,
  },
  {
    id: 'bt_time',
    icon: '☕',
    title: 'BTtime',
    description: 'ブラックサンダーを食べながら作業休憩タイム！臨時掲示板も開設',
    cost: POINT_COST.BT_TIME,
    type: 'bt_time' as const,
  },
  {
    id: 'bt_fever',
    icon: '⚡',
    title: 'BTfever',
    description: 'チーム全員でブラックサンダーを食べながら対面コミュニケーション！',
    cost: POINT_COST.BT_FEVER,
    type: 'bt_fever' as const,
  },
]

type ShopItemType = 'present' | 'bt_time' | 'bt_fever'

export default function ShopPage() {
  const [myPoints] = useState(SAMPLE_MY_POINTS)
  const [selected, setSelected] = useState<ShopItemType | null>(null)
  const [toUserId, setToUserId] = useState(SAMPLE_MEMBERS[0].id)
  const [message, setMessage] = useState('')
  const [activeEvent, setActiveEvent] = useState<BTEvent | null>(null)
  const [presentSent, setPresentSent] = useState(false)

  async function handleConfirm() {
    if (!selected) return
    // TODO(api): 各アクションを API 呼び出しに差し替え
    await new Promise((r) => setTimeout(r, 500))

    if (selected === 'present') {
      setPresentSent(true)
      setMessage('')
      setSelected(null)
    } else {
      const event: BTEvent = {
        id: `ev-${Date.now()}`,
        type: selected,
        hostId: 'u-001',
        startedAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        active: true,
      }
      setActiveEvent(event)
      setSelected(null)
    }
  }

  const selectedItem = SHOP_ITEMS.find((i) => i.id === selected)
  const canAfford = selectedItem ? myPoints >= selectedItem.cost : false

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">BTショップ</h1>
          <p className="text-sm text-bt-dark/50 mt-0.5">ポイントを使ってイベントを発動しよう</p>
        </div>
        <div className="rounded-xl bg-bt-gold/20 px-4 py-2 text-center">
          <p className="text-xs text-bt-dark/50">所持PT</p>
          <p className="text-2xl font-bold text-bt-gold">{myPoints}</p>
        </div>
      </div>

      {/* 発動中イベント */}
      {activeEvent && (
        <div className="rounded-xl bg-bt-gold/20 border border-bt-gold p-4 flex items-center gap-3">
          <span className="text-3xl">{activeEvent.type === 'bt_time' ? '☕' : '⚡'}</span>
          <div>
            <p className="font-bold">
              {activeEvent.type === 'bt_time' ? 'BTtime' : 'BTfever'} 開催中！
            </p>
            <p className="text-sm text-bt-dark/60">チームに通知が送られました 🍫</p>
          </div>
        </div>
      )}

      {/* プレゼント送信完了 */}
      {presentSent && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <span className="text-2xl">🍫</span>
          <p className="font-medium text-green-700">BTプレゼントを送りました！</p>
        </div>
      )}

      {/* ショップアイテム一覧 */}
      <div className="space-y-3">
        {SHOP_ITEMS.map((item) => {
          const affordable = myPoints >= item.cost
          const isSelected = selected === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSelected(isSelected ? null : (item.id as ShopItemType))}
              disabled={!affordable}
              className={`w-full rounded-xl p-5 text-left border-2 transition-all
                ${isSelected
                  ? 'border-bt-gold bg-bt-gold/10'
                  : affordable
                  ? 'border-bt-dark/10 bg-white hover:border-bt-gold/50 hover:bg-bt-gold/5'
                  : 'border-bt-dark/5 bg-white/50 opacity-50 cursor-not-allowed'
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-bt-dark/60 mt-0.5">{item.description}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap
                    ${affordable ? 'bg-bt-gold text-bt-dark' : 'bg-bt-dark/10 text-bt-dark/40'}`}
                >
                  {item.cost} PT
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 確認パネル */}
      {selected && selectedItem && (
        <div className="rounded-xl bg-white border border-bt-gold/30 p-5 space-y-4 shadow-sm">
          <h2 className="font-bold">
            {selectedItem.icon} {selectedItem.title} を使う
          </h2>

          {selected === 'present' && (
            <>
              <div>
                <label htmlFor="shop-recipient" className="block text-sm font-medium mb-1">送る相手</label>
                <select
                  id="shop-recipient"
                  aria-label="送る相手"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full rounded-lg border border-bt-dark/15 p-2.5 text-sm"
                >
                  {SAMPLE_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="shop-message" className="block text-sm font-medium mb-1">ひとことメッセージ (任意)</label>
                <input
                  id="shop-message"
                  aria-label="メッセージ"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="お疲れ様！"
                  className="w-full rounded-lg border border-bt-dark/15 p-2.5 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-sm text-bt-dark/60 bg-bt-dark/3 rounded-lg px-3 py-2">
            <span>消費ポイント</span>
            <span className="font-bold text-bt-dark">
              {myPoints} PT → {myPoints - selectedItem.cost} PT
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelected(null)}
              className="flex-1 rounded-lg border border-bt-dark/20 py-2.5 text-sm font-medium text-bt-dark/60 hover:bg-bt-dark/5"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canAfford}
              className="flex-1 rounded-lg bg-bt-gold py-2.5 text-sm font-bold text-bt-dark disabled:opacity-40 hover:brightness-105"
            >
              確定する ⚡
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
