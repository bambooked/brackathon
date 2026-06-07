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

const MENU_BT = {
  normal: '/nomal_bt.PNG',
  active: '/breaked_bt.PNG',
} as const

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

  const eventLabel = activeEvent?.active
    ? activeEvent.event_type === 'time'
      ? 'BTtime 開催中'
      : 'BTfever 開催中'
    : null

  return (
    <>
      {eventLabel && (
        <div className="fixed left-1/2 top-3 z-40 -translate-x-1/2 rounded-full bg-bt-thunder px-5 py-2 text-center text-sm font-black text-bt-black shadow-lg shadow-bt-thunder/30 animate-pulse-thunder">
          {eventLabel}
        </div>
      )}

      <nav className="fixed left-[156px] top-40 z-20 hidden w-40 flex-col gap-3 xl:flex">
        <div className="bt-menu-thunder" aria-hidden="true" />
        <div className="bt-menu-copy" aria-hidden="true">
          <span>メニュー！</span>
          <span>圧倒的</span>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group relative z-10 flex aspect-[16/9] w-full shrink-0 items-center justify-center transition-transform hover:-rotate-2 hover:scale-105 ${
                isActive ? '-rotate-2 scale-105' : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={isActive ? MENU_BT.active : MENU_BT.normal}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain drop-shadow-xl"
                />
                <span className="relative z-10 max-w-[78%] text-center text-lg font-black leading-none text-white [text-shadow:2px_2px_0_rgba(0,0,0,0.85)]">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <nav className="fixed bottom-3 left-1/2 z-40 grid w-[min(96vw,32rem)] -translate-x-1/2 grid-cols-5 gap-1 rounded-full bg-bt-black/80 px-2 py-2 shadow-xl shadow-bt-black/60 backdrop-blur xl:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `relative flex aspect-[16/9] min-w-0 items-center justify-center transition-transform ${
                isActive ? '-rotate-2 scale-105' : ''
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={isActive ? MENU_BT.active : MENU_BT.normal}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-contain"
                />
                <span className="relative z-10 max-w-[82%] text-center text-[10px] font-black leading-none text-white [text-shadow:1px_1px_0_rgba(0,0,0,0.85)]">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="fixed right-6 top-5 z-20 flex h-20 w-28 shrink-0 items-center justify-center md:right-12 md:h-24 md:w-36">
          <div className="pointer-events-none absolute right-1/2 top-1/2 h-[42rem] w-[42rem] -translate-y-1/2 translate-x-[76%] rounded-full bg-red-700 shadow-xl shadow-red-950/60 md:h-[56rem] md:w-[56rem] md:translate-x-[80%]" />
          <div className="relative z-10 flex flex-col items-center text-bt-cream [text-shadow:2px_2px_0_rgba(0,0,0,0.55)]">
            <span className="text-5xl font-black leading-none tracking-wide md:text-6xl">{myPoints}</span>
            <span className="mt-1 text-base font-black leading-none tracking-[0.18em] md:text-lg">PT</span>
          </div>
        </div>
      )}
    </>
  )
}
