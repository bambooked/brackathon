import { Outlet } from 'react-router-dom'

import Header from './Header'

/** ログイン後の共通レイアウト (ヘッダ + 各ページの描画領域) */
export default function Layout() {
  return (
    <div className="min-h-screen bg-bt-cream text-bt-dark">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
