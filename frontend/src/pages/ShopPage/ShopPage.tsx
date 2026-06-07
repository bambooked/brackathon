import { useEffect, useState } from 'react'

import { fetchUsers, type TeamMember } from '@/api/auth'
import { fetchMyPoints, sendPresent, startEvent } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'
import { type BTEvent, POINT_COST } from '@/types'

const FALLBACK_MEMBERS: TeamMember[] = []

const SHOP_ITEMS = [
  {
    id: 'present',
    icon: '',
    title: 'BTプレゼント',
    description: '頑張った仲間にブラックサンダーを1個プレゼント',
    cost: POINT_COST.PRESENT,
    type: 'present' as const,
  },
  {
    id: 'bt_time',
    icon: '',
    title: 'BTtime',
    description: 'ブラックサンダーを食べながら作業休憩タイム！臨時掲示板も開設',
    cost: POINT_COST.BT_TIME,
    type: 'bt_time' as const,
  },
  {
    id: 'bt_fever',
    icon: '',
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
          <h1 className="text-2xl font-bold text-bt-cream">BTショップ</h1>
          <p className="text-sm text-bt-gray-dark mt-0.5">ポイントを使ってイベントを発動しよう</p>
        </div>
        <div className="rounded-xl bg-bt-card border-2 border-bt-thunder px-4 py-2 text-center shadow-lg shadow-bt-thunder/30 animate-pulse-thunder">
          <p className="text-xs text-bt-gray-dark">所持PT</p>
          <p className="text-2xl font-bold text-bt-thunder">{myPoints}</p>
        </div>
      </div>

      {/* 発動中イベント */}
      {activeEvent && (
        <div className="rounded-xl bg-bt-thunder/20 border-2 border-bt-thunder p-4 flex items-center gap-3 shadow-lg shadow-bt-thunder/30 animate-border-flash">
          <div>
            <p className="font-bold text-bt-cream">
              {activeEvent.type === 'bt_time' ? 'BTtime' : 'BTfever'} 開催中！
            </p>
            <p className="text-sm text-bt-gray">チームに通知が送られました</p>
          </div>
        </div>
      )}

      {/* プレゼント送信完了 */}
      {presentSent && (
        <div className="rounded-xl bg-bt-thunder/20 border-2 border-bt-thunder p-4 flex items-center gap-3 shadow-lg shadow-bt-thunder/20">
          <p className="font-medium text-bt-thunder">BTプレゼントを送りました！</p>
        </div>
      )}

      {/* ショップアイテム一覧 */}
      <div className="space-y-3">
        {SHOP_ITEMS.map((item) => {
          const affordable = myPoints >= item.cost
          const isSelected = selected === item.id
          const isPresent = item.id === 'present'
          return (
            <button
              key={item.id}
              onClick={() => setSelected(isSelected ? null : (item.id as ShopItemType))}
              disabled={!affordable}
              className={`w-full rounded-xl overflow-hidden text-left transition-all transform shadow-lg p-3 border-4
                ${isSelected
                  ? 'shadow-bt-thunder/40 scale-105 border-bt-thunder'
                  : affordable
                  ? isPresent
                    ? 'hover:scale-105 shadow-bt-thunder/20 hover:shadow-bt-thunder/40 border-bt-thunder'
                    : 'hover:scale-102 shadow-bt-black/50 hover:shadow-bt-thunder/30 border-bt-thunder'
                  : 'opacity-50 cursor-not-allowed shadow-bt-black/30 border-bt-gray-dark/30'
                }`}
              style={affordable ? {
                backgroundImage: 'url(/blackthunder.png)',
                backgroundSize: '130% 130%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              } : {
                backgroundColor: '#333',
              }}
            >
              <div className={`rounded-lg p-5 ${isSelected ? 'bg-bt-thunder/30' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div>
                      <p className={`font-bold ${affordable ? 'text-bt-cream' : 'text-bt-gray-dark'}`}>{item.title}</p>
                      <p className={`text-sm mt-0.5 ${affordable ? 'text-bt-gray' : 'text-bt-gray-dark/60'}`}>{item.description}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold whitespace-nowrap
                      ${affordable ? 'bg-bt-thunder text-bt-black' : 'bg-bt-gray-dark/30 text-bt-gray-dark'}`}
                  >
                    {item.cost} PT
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 確認パネル */}
      {selected && selectedItem && (
        <div className="rounded-xl bg-bt-card border-2 border-bt-thunder p-5 space-y-4 shadow-xl shadow-bt-thunder/30">
          <h2 className="font-bold text-bt-cream">
            {selectedItem.icon} {selectedItem.title} を使う
          </h2>

          {selected === 'present' && (
            <>
              <div>
                <label htmlFor="shop-recipient" className="block text-sm font-medium mb-1 text-bt-gray">送る相手</label>
                <select
                  id="shop-recipient"
                  aria-label="送る相手"
                  value={toUserId}
                  onChange={(e) => setToUserId(e.target.value)}
                  className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream p-2.5 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="shop-message" className="block text-sm font-medium mb-1 text-bt-gray">ひとことメッセージ (任意)</label>
                <input
                  id="shop-message"
                  aria-label="メッセージ"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="お疲れ様！"
                  className="w-full rounded-lg border border-bt-thunder/30 bg-bt-black/20 text-bt-cream p-2.5 text-sm outline-none focus:border-bt-thunder focus:ring-2 focus:ring-bt-thunder/20 transition-all placeholder:text-bt-gray-dark"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-sm text-bt-gray bg-bt-black/30 rounded-lg px-3 py-2">
            <span>消費ポイント</span>
            <span className="font-bold text-bt-thunder">
              {myPoints} PT → {myPoints - selectedItem.cost} PT
            </span>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-400/30 rounded-lg px-3 py-2">{errorMsg}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setSelected(null); setErrorMsg('') }}
              className="flex-1 rounded-lg border border-bt-thunder/30 py-2.5 text-sm font-medium text-bt-gray hover:bg-bt-card-hover transition-all"
            >
              キャンセル
            </button>
            <button
              onClick={handleConfirm}
              disabled={!canAfford || confirming || (selected === 'present' && !toUserId)}
              className="flex-1 rounded-lg bg-bt-thunder py-2.5 text-sm font-bold text-bt-black disabled:opacity-40 hover:bg-bt-gold-bright transition-all shadow-lg shadow-bt-thunder/40"
            >
              {confirming ? '処理中...' : '確定する'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
