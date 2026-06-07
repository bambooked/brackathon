/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Black Thunder ブランドカラー - 漆黒と稲妻イエローの世界観
        bt: {
          // 漆黒ベース
          black: '#000000',          // 純黒
          dark: '#111111',           // リッチブラック
          card: '#1F1F1F',           // カード背景用ダークグレー
          'card-hover': '#2A2A2A',   // カードホバー時

          // 稲妻イエロー（アクセント）
          thunder: '#FFE600',        // 鮮烈な稲妻イエロー
          gold: '#FFD700',           // ゴールド
          'gold-bright': '#FFED4E',  // 明るめゴールド（ホバー等）

          // テキスト
          cream: '#FFFFFF',          // 基本テキスト（純白）
          gray: '#CCCCCC',           // セカンダリテキスト
          'gray-dark': '#888888',    // 補助テキスト
        },
      },
      animation: {
        'pulse-thunder': 'pulseThunder 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-flash': 'borderFlash 1.5s ease-in-out infinite',
        'lightning': 'lightning 0.5s ease-in-out infinite',
      },
      keyframes: {
        pulseThunder: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        borderFlash: {
          '0%, 100%': { borderColor: '#FFE600', boxShadow: '0 0 10px #FFE600' },
          '50%': { borderColor: '#FFD700', boxShadow: '0 0 20px #FFD700' },
        },
        lightning: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)' },
        },
      },
    },
  },
  plugins: [],
}
