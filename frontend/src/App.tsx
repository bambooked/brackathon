// ============================================================
// ルーティング定義 (ページ別)
// ------------------------------------------------------------
// 画面一覧:
//   /login         ログイン
//   /              ホーム (当日日報 + リアクション + アーカイブ)
//   /post          日報投稿
//   /break-thunder Break Thunder 掲示板
//   /shop          BTショップ (プレゼント / Break Thunder / BTfever)
//   /mypage        マイページ (自分のアーカイブ + ポイント)
// ============================================================
import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout/Layout'
import { useAuth } from './contexts/AuthContext'
import BreakThunderPage from './pages/BreakThunderPage/BreakThunderPage'
import HomePage from './pages/HomePage/HomePage'
import LoginPage from './pages/LoginPage/LoginPage'
import MyPage from './pages/MyPage/MyPage'
import PostPage from './pages/PostPage/PostPage'
import ShopPage from './pages/ShopPage/ShopPage'

/** 未ログインなら /login へリダイレクトするガード（復元中はスピナーを表示） */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bt-dark">
        <span className="text-bt-thunder text-lg font-bold animate-pulse-thunder">Loading...</span>
      </div>
    )
  }
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
        <Route path="/" element={<HomePage />} />
        <Route path="/post" element={<PostPage />} />
        <Route path="/break-thunder" element={<BreakThunderPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/mypage" element={<MyPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
