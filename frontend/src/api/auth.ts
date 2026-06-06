// ============================================================
// 認証 API スタブ
// 【先輩への受け渡しメモ】
//   - login: POST /auth/login  (LoginInput -> AuthResult)
//   - Googleアカウント連携を入れる場合はここに addGoogleAuth 等を追加予定。
//   下記は接続前のモック。TODO(api) を本実装に置換してください。
// ============================================================
import type { AuthResult, LoginInput, User } from '@/types'

import { mockDelay } from './client'

export async function login(input: LoginInput): Promise<AuthResult> {
  // TODO(api): return request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(input) })
  await mockDelay()
  const mockUser: User = {
    id: 'u-001',
    name: 'テスト太郎',
    email: input.email,
    teamId: input.teamId,
  }
  return { token: 'mock-token', user: mockUser }
}

export async function logout(): Promise<void> {
  // TODO(api): return request('/auth/logout', { method: 'POST' })
  await mockDelay(100)
}
