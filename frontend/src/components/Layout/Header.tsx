import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { to: '/', label: 'ホーム' },
  { to: '/reports', label: '日報' },
  { to: '/present', label: 'プレゼント' },
  { to: '/events', label: 'イベント' },
]

export default function Header() {
  const { user } = useAuth()
  return (
    <header className="flex items-center justify-between bg-bt-dark px-6 py-3 text-bt-cream">
      <div className="flex items-center gap-6">
        <span className="text-lg font-bold text-bt-gold">⚡ BT</span>
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'font-bold text-bt-gold' : 'hover:text-bt-gold'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {user && <span className="text-sm">{user.name}</span>}
    </header>
  )
}
