import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { fetchBreakThunderActive } from '@/api/breakThunder'
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
  break_thunder: '☕ Break Thunder 掲示板が開きました！',
  bt_time: '☕ Break Thunder 掲示板が開きました！',
  bt_fever: '⚡ BTfever 開催中！',
}

export default function Header() {
  const { user } = useAuth()
  const [eventLabel, setEventLabel] = useState<string | null>(null)
  const [breakThunderEndsAt, setBreakThunderEndsAt] = useState<string | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const breakThunderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const armBreakThunderTab = useCallback((endsAt: string) => {
    setBreakThunderEndsAt(endsAt)
    if (breakThunderTimerRef.current) clearTimeout(breakThunderTimerRef.current)
    const remaining = new Date(endsAt).getTime() - Date.now()
    if (remaining > 0) {
      breakThunderTimerRef.current = setTimeout(() => setBreakThunderEndsAt(null), remaining)
    } else {
      setBreakThunderEndsAt(null)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    fetchBreakThunderActive()
      .then((active) => {
        if (active.active && active.endsAt) armBreakThunderTab(active.endsAt)
      })
      .catch(() => {/* ヘッダー表示だけなので失敗時は無視 */})

    const es = connectEventStream((event) => {
      setEventLabel(EVENT_LABEL[event.type])
      if (event.type === 'break_thunder' || event.type === 'bt_time') {
        armBreakThunderTab(event.ends_at)
      }

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
      if (breakThunderTimerRef.current) clearTimeout(breakThunderTimerRef.current)
    }
  }, [armBreakThunderTab, user])

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
            {breakThunderEndsAt && (
              <NavLink
                to="/break-thunder"
                className={({ isActive }) =>
                  `animate-break-thunder-tab rounded-full px-3 py-1 font-bold shadow-sm transition-colors ${
                    isActive
                      ? 'bg-bt-cream text-bt-dark'
                      : 'bg-bt-gold text-bt-dark hover:brightness-110'
                  }`
                }
              >
                ☕ 掲示板
              </NavLink>
            )}
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
