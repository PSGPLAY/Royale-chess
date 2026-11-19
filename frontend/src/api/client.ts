/**
 * Royal Chess API Client
 * Connects the React frontend to the Django REST & Channels backend.
 */

const RENDER_API_URL = 'https://royale-chess.onrender.com'
const RENDER_WS_URL = 'wss://royale-chess.onrender.com'
export const AUTH_PROFILE_STORAGE_KEY = 'royal_chess_auth_profile'
const MATCH_TOKEN_PREFIX = 'royal_chess_match_token:'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function joinBaseUrl(baseUrl: string, path: string): string {
  return `${normalizeBaseUrl(baseUrl)}/${path.replace(/^\/+/, '')}`
}

function productionBaseUrl(url: string, protocol: 'https:' | 'wss:', fallback: string): string {
  try {
    const parsedUrl = new URL(url)
    if (['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(parsedUrl.hostname)) {
      return fallback
    }
    parsedUrl.protocol = protocol
    return normalizeBaseUrl(parsedUrl.toString())
  } catch {
    return fallback
  }
}

export function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
  if (configuredUrl) {
    return import.meta.env.PROD
      ? productionBaseUrl(configuredUrl, 'https:', RENDER_API_URL)
      : normalizeBaseUrl(configuredUrl)
  }
  // Let localhost frontend development use the deployed backend by default.
  if (import.meta.env.PROD || import.meta.env.DEV) return RENDER_API_URL
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
    const host = window.location.hostname || 'localhost'
    return `${protocol}//${host}:8000`
  }
  return 'http://localhost:8000'
}

export function getWsBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_WS_BASE_URL
  if (configuredUrl) {
    return import.meta.env.PROD
      ? productionBaseUrl(configuredUrl, 'wss:', RENDER_WS_URL)
      : normalizeBaseUrl(configuredUrl)
  }
  if (import.meta.env.PROD || import.meta.env.DEV) return RENDER_WS_URL
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname || 'localhost'
    return `${protocol}//${host}:8000`
  }
  return 'ws://localhost:8000'
}

export interface UserProfileData {
  id: number
  username: string
  nickname: string
  avatar: string
  persistent_coins: number
  rating_elo: number
  global_rank?: number
  total_matches: number
  wins: number
  losses: number
  draws: number
  win_rate: number
  created_at: string
}

export interface MatchData {
  id: string
  mode: string
  status: 'waiting' | 'active' | 'completed' | 'abandoned'
  white_player: number | null
  black_player: number | null
  white_guest_name: string
  black_guest_name: string
  white_username: string
  black_username: string
  fen: string
  turn: 'w' | 'b'
  move_count: number
  white_coins: number
  black_coins: number
  white_time_remaining_ms: number
  black_time_remaining_ms: number
  white_shop_slots: string[]
  black_shop_slots: string[]
  winner: 'w' | 'b' | 'draw' | null
  end_reason: string | null
  created_at: string
  updated_at: string
  moves: Array<{
    id: number
    move_number: number
    player: 'w' | 'b'
    action_type: string
    piece_type: string
    from_square: string
    to_square: string
    description: string
    san: string
    fen_after: string
    created_at: string
  }>
}

export interface MatchmakeResult {
  status: 'waiting' | 'connected'
  role: 'w' | 'b'
  match: MatchData
  message: string
  seat_token: string
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('royal_chess_auth_token')
  }

  private getMatchToken(matchId: string): string | null {
    return localStorage.getItem(`${MATCH_TOKEN_PREFIX}${matchId}`)
  }

  saveMatchToken(matchId: string, token: string): void {
    localStorage.setItem(`${MATCH_TOKEN_PREFIX}${matchId}`, token)
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken()
    // Public auth endpoints must not receive a previously stored token. A stale
    // token (for example, one issued before the Render database was reset)
    // makes DRF reject the request before the login/register view runs.
    const isPublicAuthRequest = /^\/api\/auth\/(login|register)\//.test(endpoint)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token && !isPublicAuthRequest) {
      headers['Authorization'] = `Token ${token}`
    }

    const matchId = endpoint.match(/^\/api\/matches\/([^/]+)\//)?.[1]
    const matchToken = matchId ? this.getMatchToken(matchId) : null
    if (matchToken) headers['Authorization'] = `Match ${matchToken}`

    const response = await fetch(joinBaseUrl(getApiBaseUrl(), endpoint), {
      ...options,
      headers,
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const errMsg =
        data.error ||
        data.message ||
        (typeof data === 'object' ? Object.values(data).flat().join(' ') : null) ||
        `Request failed with status ${response.status}`
      throw new ApiError(errMsg, response.status)
    }

    return data as T
  }

  // ── Authentication ────────────────────────────────────────────────────────

  async register(username: string, email: string, password: string): Promise<{ token: string; user: UserProfileData }> {
    return this.request<{ token: string; user: UserProfileData }>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  }

  async login(usernameOrEmail: string, password: string): Promise<{ token: string; user: UserProfileData; message: string }> {
    return this.request<{ token: string; user: UserProfileData; message: string }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, password }),
    })
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/logout/', {
      method: 'POST',
    })
  }

  async getProfile(): Promise<UserProfileData> {
    return this.request<UserProfileData>('/api/auth/profile/')
  }

  async updateProfile(updates: { nickname?: string; avatar?: string }): Promise<UserProfileData> {
    return this.request<UserProfileData>('/api/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
  }

  async getLeaderboard(limit = 20): Promise<UserProfileData[]> {
    return this.request<UserProfileData[]>(`/api/auth/leaderboard/?limit=${limit}`)
  }

  async getMatchHistory(): Promise<MatchData[]> {
    return this.request<MatchData[]>('/api/matches/history/')
  }

  // ── Matchmaking & Matches ─────────────────────────────────────────────────

  async matchmake(mode = 'royale', guestName = ''): Promise<MatchmakeResult> {
    return this.request<MatchmakeResult>('/api/matches/matchmake/', {
      method: 'POST',
      body: JSON.stringify({ mode, guest_name: guestName }),
    })
  }

  async cancelMatchmaking(matchId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/matches/${matchId}/cancel/`, {
      method: 'POST',
    })
  }

  async getMatch(matchId: string): Promise<MatchData> {
    return this.request<MatchData>(`/api/matches/${matchId}/`)
  }

  async checkMatchClock(matchId: string): Promise<MatchData> {
    return this.request<MatchData>(`/api/matches/${matchId}/clock/`, { method: 'POST' })
  }

  async submitMove(matchId: string, from: string, to: string, promotion = 'q'): Promise<{ match: MatchData }> {
    return this.request<{ match: MatchData }>(`/api/matches/${matchId}/move/`, {
      method: 'POST',
      body: JSON.stringify({ from, to, promotion }),
    })
  }

  async deployPiece(matchId: string, player: 'w' | 'b', pieceType: string, square: string): Promise<{ match: MatchData }> {
    return this.request<{ match: MatchData }>(`/api/matches/${matchId}/deploy/`, {
      method: 'POST',
      body: JSON.stringify({ player, piece_type: pieceType, square }),
    })
  }

  async rerollShop(matchId: string, player: 'w' | 'b'): Promise<{ match: MatchData }> {
    return this.request<{ match: MatchData }>(`/api/matches/${matchId}/reroll/`, {
      method: 'POST',
      body: JSON.stringify({ player }),
    })
  }

  async resignMatch(matchId: string, player: 'w' | 'b'): Promise<{ match: MatchData }> {
    return this.request<{ match: MatchData }>(`/api/matches/${matchId}/resign/`, {
      method: 'POST',
      body: JSON.stringify({ player }),
    })
  }

  createWebSocket(matchId: string): WebSocket {
    const token = this.getMatchToken(matchId)
    return new WebSocket(joinBaseUrl(getWsBaseUrl(), `/ws/match/${matchId}/`), token ? ['royal-chess-match', token] : undefined)
  }
}

export const api = new ApiClient()

