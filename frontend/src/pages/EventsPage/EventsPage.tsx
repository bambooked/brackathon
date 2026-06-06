// ============================================================
// イベントページ — BTtime(休憩) / BTfever(対面コミュニケーション)
// ポイントを消費して開催する。コストは PRESENT 基準の倍率。
// ============================================================
import { useState } from 'react'

import { startEvent } from '@/api/points'
import { type BTEvent,POINT_COST } from '@/types'

export default function EventsPage() {
  const [activeEvent, setActiveEvent] = useState<BTEvent | null>(null)

  async function handleStart(type: BTEvent['type']) {
    const event = await startEvent(type)
    setActiveEvent(event)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">イベント</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => handleStart('bt_time')}
          className="rounded-lg bg-white p-6 text-left shadow hover:ring-2 hover:ring-bt-gold"
        >
          <p className="text-lg font-bold">☕ BTtime</p>
          <p className="text-sm text-bt-dark/60">作業休憩 + 臨時掲示板</p>
          <p className="mt-2 text-sm">消費 {POINT_COST.BT_TIME} PT</p>
        </button>

        <button
          onClick={() => handleStart('bt_fever')}
          className="rounded-lg bg-white p-6 text-left shadow hover:ring-2 hover:ring-bt-gold"
        >
          <p className="text-lg font-bold">⚡ BTfever</p>
          <p className="text-sm text-bt-dark/60">対面コミュニケーションタイム</p>
          <p className="mt-2 text-sm">消費 {POINT_COST.BT_FEVER} PT</p>
        </button>
      </div>

      {activeEvent && (
        <p className="rounded bg-bt-gold/20 p-3">
          {activeEvent.type === 'bt_time' ? 'BTtime' : 'BTfever'} を開始しました！
        </p>
      )}
    </div>
  )
}
