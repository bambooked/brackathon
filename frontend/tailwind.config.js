/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Black Thunder ブランドカラー（仮）
        bt: {
          dark: '#1a1a1a',
          gold: '#c9a227',
          cream: '#f5efe0',
        },
      },
    },
  },
  plugins: [],
}
