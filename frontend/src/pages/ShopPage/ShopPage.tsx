import { useEffect, useState } from 'react'

import { fetchUsers, type TeamMember } from '@/api/auth'
import { fetchMyPoints, sendPresent, startEvent } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'
import { type BTEvent, POINT_COST } from '@/types'

const FALLBACK_MEMBERS: TeamMember[] = []

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
  const { user } = useAuth()
  const [myPoints, setMyPoints] = useState(0)
  const [members, setMembers] = useState<TeamMember[]>(FALLBACK_MEMBERS)
  const [selected, setSelected] = useState<ShopItemType | null>(null)
  const [toUserId, setToUserId] = useState('')
  const [message, setMessage] = useState('')
  const [activeEvent, setActiveEvent] = useState<BTEvent | null>(null)
  const [presentSent, setPresentSent] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetchMyPoints().then(setMyPoints).catch(() => {/* フォールバック */})
    fetchUsers()
      .then((users) => {
        // 自分自身を除外する
        const others = users.filter((u) => u.id !== user?.id)
        setMembers(others)
        if (others.length > 0) setToUserId(others[0].id)
      })
      .catch(() => {/* フォールバック */})
  }, [user?.id])

  async function handleConfirm() {
    if (!selected || confirming) return
    setConfirming(true)
    setErrorMsg('')
    try {
      if (selected === 'present') {
        await sendPresent(toUserId, message)
        setMyPoints((p) => p - POINT_COST.PRESENT)
        setPresentSent(true)
        setMessage('')
        setSelected(null)
      } else {
        const event = await startEvent(selected)
        setMyPoints((p) => p - (selected === 'bt_time' ? POINT_COST.BT_TIME : POINT_COST.BT_FEVER))
        setActiveEvent(event)
        setSelected(null)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '操作に失敗しました'
      setErrorMsg(msg)
    } finally {
      setConfirming(false)
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
                  {members.map((m) => (
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

          {errorMsg && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setSelected(null); setErrorMsg('') }}
              className="flex-1 rounded-lg border border-bt-dark/20 py-2.5 text-sm font-medium text-bt-dark/60 hover:bg-bt-dark/5"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canAfford || confirming || (selected === 'present' && !toUserId)}
              className="flex-1 rounded-lg bg-bt-gold py-2.5 text-sm font-bold text-bt-dark disabled:opacity-40 hover:brightness-105"
            >
              {confirming ? '処理中...' : '確定する ⚡'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
