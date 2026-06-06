import { API_BASE_URL, getToken } from './client'

export type SSEEventType = 'bt_time' | 'bt_fever'

export interface SSEEvent {
  type: SSEEventType
  ends_at: string
}

/**
 * SSE ストリームに接続する。
 * EventSource は Authorization ヘッダーを送れないため ?token= で認証する。
 * 返り値の EventSource は呼び出し元で close() すること。
 */
export function connectEventStream(onEvent: (event: SSEEvent) => void): EventSource {
  const token = getToken()
  const url = `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token ?? '')}`
  const es = new EventSource(url)

  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data as string) as SSEEvent
      onEvent(data)
    } catch {
      // JSON パース失敗は無視（keepalive comment など）
    }
  }

  return es
}
