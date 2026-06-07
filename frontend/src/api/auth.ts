import type { AuthResult, User } from '@/types'

import { clearToken, request, setToken } from './client'

// バックエンドのレスポンス型
interface BackendUser {
  id: number
  name: string
  email: string
  role: string
  team_name: string
  created_at: string
  updated_at: string
}

interface GoogleLoginResponse {
  access_token: string
  token_type: string
  user: BackendUser
}

export interface TeamMember {
  id: string
  name: string
}

function mapUser(u: BackendUser): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    teamId: u.team_name,
  }
}

export async function loginWithGoogle(idToken: string, teamName: string): Promise<AuthResult> {
  const res = await request<GoogleLoginResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken, team_name: teamName }),
  })
  setToken(res.access_token)
  return { token: res.access_token, user: mapUser(res.user) }
}

export async function logout(): Promise<void> {
  clearToken()
}

export async function getCurrentUser(): Promise<User> {
  const res = await request<BackendUser>('/auth/me')
  return mapUser(res)
}

export async function fetchUsers(): Promise<TeamMember[]> {
  const res = await request<{
    users: { id: number; name: string; nickname: string | null; use_nickname: boolean; team_name: string }[]
  }>('/auth/users')
  return res.users.map((u) => ({
    id: String(u.id),
    name: u.use_nickname && u.nickname ? u.nickname : u.name,
  }))
}

export async function updateProfile(data: {
  name?: string
  nickname?: string
  use_nickname?: boolean
}): Promise<User> {
  const res = await request<BackendUser>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  return mapUser(res)
}
