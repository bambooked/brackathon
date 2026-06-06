// Vitest 共通セットアップ
// jest-dom のカスタムマッチャ (toBeInTheDocument 等) を有効化
import '@testing-library/jest-dom'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// 各テスト後に DOM をクリーンアップ
afterEach(() => {
  cleanup()
})
