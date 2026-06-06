import { NavLink } from 'react-router-dom'

import type { ActiveEvent } from '@/api/points'
import { fetchMyPoints } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

const navItems = [
  { to: '/', label: 'ホーム', icon: '🏠' },
  { to: '/post', label: '投稿', icon: '✏️' },
  { to: '/invisible', label: '見える化', icon: '🔍' },
  { to: '/shop', label: 'BTショップ', icon: '⚡' },
  { to: '/mypage', label: 'マイページ', icon: '👤' },
]

interface HeaderProps {
  activeEvent: ActiveEvent | null
}

export default function Header({ activeEvent }: HeaderProps) {
  const { user } = useAuth()
  const [myPoints, setMyPoints] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchMyPoints().then(setMyPoints).catch(() => {})
    const id = setInterval(() => {
      fetchMyPoints().then(setMyPoints).catch(() => {})
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
    <div className="relative z-20">
      {eventLabel && (
        <div className="bg-bt-thunder text-bt-black text-center text-sm font-bold py-2 px-4 animate-pulse-thunder">
          {eventLabel}
        </div>
      )}
      <header className="sticky top-0 z-20 bg-bt-black border-b-2 border-bt-thunder/30 shadow-lg shadow-bt-thunder/10">
        <div className="flex items-center justify-between px-6 md:px-20 lg:px-24 py-4">
          {/* 左側: ロゴ + ナビゲーション */}
          <div className="flex items-center gap-8">
            {/* ロゴ */}
            <NavLink to="/" className="flex items-center gap-3 group">
              <img
                src="/blackthunder_logo-2.png"
                alt="Black Thunder"
                className="h-12 md:h-16 object-contain transition-transform group-hover:scale-105"
              />
            </NavLink>

            {/* ナビゲーション */}
            <nav className="hidden md:flex gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-2 px-4 py-2 rounded-lg bg-bt-thunder text-bt-black font-bold transition-all'
                      : 'flex items-center gap-2 px-4 py-2 rounded-lg text-bt-gray hover:text-bt-thunder hover:bg-bt-card transition-all'
                  }
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 右側: ポイント表示 + ユーザー名 */}
          {user && (
            <div className="flex items-center gap-4">
              {/* ポイント残高 */}
              <div className="flex items-center gap-2 bg-bt-card border-2 border-bt-thunder rounded-lg px-4 py-2">
                <span className="text-2xl">⚡</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-bt-thunder">{myPoints}</span>
                  <span className="text-xs font-medium text-bt-gray">PT</span>
                </div>
              </div>

              {/* ユーザー名 */}
              <div className="flex items-center gap-2 bg-bt-card/50 rounded-full px-4 py-2 border border-bt-thunder/20">
                <span className="text-sm font-medium text-bt-cream">{user.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* モバイルナビゲーション */}
        <nav className="md:hidden flex justify-around border-t border-bt-thunder/20 px-2 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-bt-thunder text-bt-black'
                  : 'flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-bt-gray'
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
    </div>
  )
}
