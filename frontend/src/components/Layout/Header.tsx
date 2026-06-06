import { NavLink } from 'react-router-dom'

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
  return (
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
  )
}
