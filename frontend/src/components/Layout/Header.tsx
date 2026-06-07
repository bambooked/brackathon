import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import type { ActiveEvent } from '@/api/points'
import { fetchMyPoints } from '@/api/points'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: 'ホーム' },
  { to: '/post', label: '投稿' },
  { to: '/invisible', label: '見える化' },
  { to: '/shop', label: 'BTショップ' },
  { to: '/mypage', label: 'マイページ' },
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
        ? 'BTtime 開催中'
        : 'BTfever 開催中'
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
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* 右側: ポイント表示 */}
          {user && (
            <div className="relative flex h-20 w-28 shrink-0 items-center justify-center md:h-24 md:w-36">
              <div className="pointer-events-none absolute right-1/2 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 translate-x-[76%] rounded-full bg-red-700 shadow-xl shadow-red-950/60 md:h-[56rem] md:w-[56rem] md:translate-x-[80%]" />
              <div className="relative z-10 flex flex-col items-center text-bt-cream [text-shadow:2px_2px_0_rgba(0,0,0,0.55)]">
                <span className="text-5xl font-black leading-none tracking-wide md:text-6xl">{myPoints}</span>
                <span className="mt-1 text-base font-black leading-none tracking-[0.18em] md:text-lg">PT</span>
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
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
    </div>
  )
}
