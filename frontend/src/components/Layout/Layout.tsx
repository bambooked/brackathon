import { Outlet } from 'react-router-dom'

import Header from './Header'

/** ログイン後の共通レイアウト (ヘッダ + 各ページの描画領域) */
export default function Layout() {
  return (
    <div className="min-h-screen bg-bt-dark text-bt-cream">
      <Header />

      {/* ブラックサンダーパッケージの黄色ギザギザ装飾 */}
      <div className="bt-zigzag-decoration bt-zigzag-left" />
      <div className="bt-zigzag-decoration bt-zigzag-right" />

      {/* 中央の雷装飾（包装紙風） */}
      <div className="bt-thunder-center" />

      <main className="mx-auto max-w-3xl px-6 py-8 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
