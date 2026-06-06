// ============================================================
// ルーティング定義 (ページ別)
// ------------------------------------------------------------
// 画面一覧:
//   /login     ログイン
//   /          ダッシュボード (BTメーター)
//   /reports   日報一覧 + リアクション
//   /present   BTプレゼント
//   /events    BTtime / BTfever
// ============================================================
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import { useAuth } from './contexts/AuthContext'
import LoginPage from './pages/LoginPage/LoginPage'
import DashboardPage from './pages/DashboardPage/DashboardPage'
import ReportsPage from './pages/ReportsPage/ReportsPage'
import PresentPage from './pages/PresentPage/PresentPage'
import EventsPage from './pages/EventsPage/EventsPage'

/** 未ログインなら /login へリダイレクトするガード */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/present" element={<PresentPage />} />
        <Route path="/events" element={<EventsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
