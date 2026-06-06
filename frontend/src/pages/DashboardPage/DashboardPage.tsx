// ============================================================
// ダッシュボード — 保有PT と BTメーター(チーム進捗) を表示
// ============================================================
import { useEffect, useState } from 'react'

import { fetchMyPoints, fetchTeamPoints } from '@/api/points'
import BTMeter from '@/components/BTMeter/BTMeter'
import { useAuth } from '@/contexts/AuthContext'
import { POINT_COST } from '@/types'

// フィーバー閾値(仮): プレゼント基準 × 人数想定。接続後に要調整。
const FEVER_THRESHOLD = POINT_COST.BT_FEVER * 6

export default function DashboardPage() {
  const { user } = useAuth()
  const [myPoints, setMyPoints] = useState(0)
  const [teamPoints, setTeamPoints] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchMyPoints().then(setMyPoints)
    fetchTeamPoints(user.teamId).then(setTeamPoints)
  }, [user])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">こんにちは、{user?.name} さん⚡</h1>
      <section className="rounded-lg bg-white p-6 shadow">
        <p className="text-sm text-bt-dark/60">あなたの保有ポイント</p>
        <p className="text-4xl font-bold text-bt-gold">{myPoints} PT</p>
      </section>
      <section className="rounded-lg bg-white p-6 shadow">
        <BTMeter current={teamPoints} max={FEVER_THRESHOLD} />
        <p className="mt-2 text-sm text-bt-dark/60">
          チームで貯めるとフィーバータイム発動！
        </p>
      </section>
    </div>
  )
}
