import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { fetchActiveEvent, type ActiveEvent } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: '🏠 ホーム' },
  { to: '/post', label: '✏️ 投稿' },
  { to: '/invisible', label: '🔍 見える化' },
  { to: '/shop', label: '⚡ BTショップ' },
  { to: '/mypage', label: '👤 マイページ' },
]

export default function Header() {
  const { user } = useAuth()
  const [activeEvent, setActiveEvent] = useState<ActiveEvent | null>(null)

  useEffect(() => {
    if (!user) return
    fetchActiveEvent().then(setActiveEvent).catch(() => {})
    // 30秒ごとにイベント状態を確認する
    const id = setInterval(() => {
      fetchActiveEvent().then(setActiveEvent).catch(() => {})
    }, 30_000)
    return () => clearInterval(id)
  }, [user])

  const eventLabel =
    activeEvent?.active
      ? activeEvent.event_type === 'time'
        ? '☕ BTtime 開催中！'
        : '⚡ BTfever 開催中！'
      : null

  return (
    <div>
      {eventLabel && (
        <div className="bg-bt-gold text-bt-dark text-center text-sm font-bold py-1.5 px-4">
          {eventLabel}
        </div>
      )}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-bt-dark px-6 py-3 text-bt-cream shadow-md">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-bt-gold">⚡ BT</span>
          <nav className="flex gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'font-bold text-bt-gold underline underline-offset-4'
                    : 'hover:text-bt-gold transition-colors'
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        {user && (
          <span className="rounded-full bg-bt-gold/20 px-3 py-1 text-sm font-medium">
            {user.name}
          </span>
        )}
      </header>
    </div>
  )
}
