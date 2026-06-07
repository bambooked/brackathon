import { request } from './client'

export interface BreakThunderActive {
  active: boolean
  scheduleId: string | null
  endsAt: string | null
}

export interface BreakThunderMessage {
  id: string
  scheduleId: string
  userId: string
  userName: string
  body: string
  createdAt: string
}

interface BackendActive {
  active: boolean
  schedule_id: number | null
  ends_at: string | null
}

interface BackendMessage {
  id: number
  schedule_id: number
  user_id: number
  user_name: string
  body: string
  created_at: string
}

function mapActive(active: BackendActive): BreakThunderActive {
  return {
    active: active.active,
    scheduleId: active.schedule_id == null ? null : String(active.schedule_id),
    endsAt: active.ends_at,
  }
}

function mapMessage(message: BackendMessage): BreakThunderMessage {
  return {
    id: String(message.id),
    scheduleId: String(message.schedule_id),
    userId: String(message.user_id),
    userName: message.user_name,
    body: message.body,
    createdAt: message.created_at,
  }
}

export async function fetchBreakThunderActive(): Promise<BreakThunderActive> {
  const res = await request<BackendActive>('/break-thunder/active')
  return mapActive(res)
}

export async function fetchBreakThunderMessages(): Promise<{
  active: BreakThunderActive
  messages: BreakThunderMessage[]
}> {
  const res = await request<{ active: BackendActive; messages: BackendMessage[] }>('/break-thunder/messages')
  return {
    active: mapActive(res.active),
    messages: res.messages.map(mapMessage),
  }
}

export async function postBreakThunderMessage(body: string): Promise<BreakThunderMessage> {
  const res = await request<BackendMessage>('/break-thunder/messages', {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  return mapMessage(res)
}
