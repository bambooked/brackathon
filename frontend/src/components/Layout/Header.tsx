import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { connectEventStream, type SSEEvent } from '@/api/events'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: '🏠 ホーム' },
  { to: '/post', label: '✏️ 投稿' },
  { to: '/invisible', label: '🔍 見える化' },
  { to: '/shop', label: '⚡ BTショップ' },
  { to: '/mypage', label: '👤 マイページ' },
]

const EVENT_LABEL: Record<SSEEvent['type'], string> = {
  bt_time: '☕ BTtime 開催中！',
  bt_fever: '⚡ BTfever 開催中！',
}

export default function Header() {
  const { user } = useAuth()
  const [eventLabel, setEventLabel] = useState<string | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return

    const es = connectEventStream((event) => {
      setEventLabel(EVENT_LABEL[event.type])

      // 既存のタイマーをリセットして ends_at に合わせてバナーを消す
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      const remaining = new Date(event.ends_at).getTime() - Date.now()
      if (remaining > 0) {
        clearTimerRef.current = setTimeout(() => setEventLabel(null), remaining)
      }
    })

    return () => {
      es.close()
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [user])

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
