import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { fetchActiveEvent, type ActiveEvent } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'

import Header from './Header'

/** ログイン後の共通レイアウト (ヘッダ + 各ページの描画領域) */
export default function Layout() {
  const { user } = useAuth()
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null)

  useEffect(() => {
    if (!user) return
    fetchActiveEvent().then(setActiveEvent).catch(() => {})
    const id = setInterval(() => {
      fetchActiveEvent().then(setActiveEvent).catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [user])

  // BTfever / BTtime 時のクラス名を動的に付与
  const eventClass = activeEvent?.active
    ? activeEvent.event_type === 'fever'
      ? 'bt-fever-mode'
      : 'bt-time-mode'
    : ''

  return (
    <div className={`min-h-screen bg-bt-dark text-bt-cream ${eventClass}`}>
      {/* ブラックサンダーパッケージの黄色ギザギザ装飾 */}
      <div className="bt-zigzag-decoration bt-zigzag-left" />
      <div className="bt-zigzag-decoration bt-zigzag-right" />

      {/* BTfever時の雷エフェクト背景（将来拡張用） */}
      {activeEvent?.active && activeEvent.event_type === 'fever' && (
        <div className="bt-lightning-bg" />
      )}
      <Header activeEvent={activeEvent} />
      <main className="mx-auto max-w-3xl px-6 py-8 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
