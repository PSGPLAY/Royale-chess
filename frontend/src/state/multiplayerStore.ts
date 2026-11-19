import { useSyncExternalStore } from 'react'
import { api } from '../api/client'
import type { MatchData } from '../api/client'
import { gameStore } from './gameStore'
import { royalModeStore } from '../royal/royalModeStore'
import { navigationStore } from './appNavigationStore'
import { authStore } from './authStore'
import { getGuestDisplayName } from '../utils/guestSession'
import type { PieceType, PieceColor, SquareName } from '../types/chess'

export interface MultiplayerState {
  isSearching: boolean
  searchMode: string
  searchElapsedSeconds: number
  activeMatch: MatchData | null
  myRole: 'w' | 'b' | null // 'w' = Blue, 'b' = Red
  isOnlineMatch: boolean
  error: string | null
}

type Listener = () => void

class MultiplayerStore {
  private state: MultiplayerState = {
    isSearching: false,
    searchMode: 'royale',
    searchElapsedSeconds: 0,
    activeMatch: null,
    myRole: null,
    isOnlineMatch: false,
    error: null,
  }

  private listeners = new Set<Listener>()
  private timerInterval: number | null = null
  private ws: WebSocket | null = null

  getState = (): MultiplayerState => this.state

  private setState = (partial: Partial<MultiplayerState>) => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((l) => l())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ── Matchmaking Workflow ──────────────────────────────────────────────────

  startMatchmaking = async (mode = 'royale') => {
    this.cleanupWebSocket()
    this.setState({
      isSearching: true,
      searchMode: mode,
      searchElapsedSeconds: 0,
      error: null,
      activeMatch: null,
      myRole: null,
    })

    // Start timer counter + auto-poll fallback to ensure mobile and PC sync instantly
    if (this.timerInterval) clearInterval(this.timerInterval)
    this.timerInterval = window.setInterval(async () => {
      this.setState({ searchElapsedSeconds: this.state.searchElapsedSeconds + 1 })
      // Auto-poll match status every second while searching as fallback if WebSocket drops
      const curMatch = this.state.activeMatch
      if (this.state.isSearching && curMatch && curMatch.status === 'waiting') {
        try {
          const fresh = await api.getMatch(curMatch.id)
          if (fresh.status === 'active') {
            const assignedRole = this.resolveRoleFromMatch(fresh, this.state.myRole || 'w')
            this.setState({ myRole: assignedRole })
            this.onMatchReady(fresh, assignedRole)
          }
        } catch {
          // ignore network glitch
        }
      }
    }, 1000)

    try {
      const user = authStore.getState().user
      const guestName = user ? '' : getGuestDisplayName()

      const result = await api.matchmake(mode, guestName)
      api.saveMatchToken(result.match.id, result.seat_token)

      this.setState({
        activeMatch: result.match,
        myRole: result.role,
      })

      // Connect to WebSocket room
      this.initWebSocket(result.match.id, result.role)

      if (result.status === 'connected') {
        // Matched immediately with an waiting opponent!
        this.onMatchReady(result.match, result.role)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Matchmaking failed'
      this.cancelMatchmaking()
      this.setState({ error: msg })
    }
  }

  cancelMatchmaking = async () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    const match = this.state.activeMatch
    if (match && match.status === 'waiting') {
      try {
        await api.cancelMatchmaking(match.id)
      } catch {
        // ignore
      }
    }

    this.cleanupWebSocket()
    this.setState({
      isSearching: false,
      searchElapsedSeconds: 0,
      activeMatch: null,
      myRole: null,
      isOnlineMatch: false,
    })
  }

  private resolveRoleFromMatch = (match: MatchData, fallbackRole?: 'w' | 'b'): 'w' | 'b' => {
    const user = authStore.getState().user
    if (user) {
      if (match.white_player === user.id) return 'w'
      if (match.black_player === user.id) return 'b'
    } else {
      const guestName = getGuestDisplayName()
      if (match.white_guest_name === guestName) return 'w'
      if (match.black_guest_name === guestName) return 'b'
    }
    return fallbackRole || 'w'
  }

  private onMatchReady = (match: MatchData, myRole: 'w' | 'b') => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }

    this.setState({
      isSearching: false,
      isOnlineMatch: true,
      activeMatch: match,
      myRole,
    })

    // Setup local game engine to mirror server match state
    this.syncMatchState(match)

    // Switch navigation to the game screen based on mode
    const isRoyale = match.mode.includes('royale')
    navigationStore.launchOnlineMatch(isRoyale)
  }

  // ── WebSocket Real-time Channel ───────────────────────────────────────────

  private initWebSocket = (matchId: string, role?: 'w' | 'b' | null) => {
    try {
      this.ws = api.createWebSocket(matchId)

      this.ws.onopen = () => {
        const assignedRole = role || this.state.myRole
        if (assignedRole && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            action: 'join_match',
            player: assignedRole,
          }))
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'match_start') {
            const assignedRole = data.creator_role || this.resolveRoleFromMatch(data.match, this.state.myRole || 'w')
            this.setState({ myRole: assignedRole })
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                action: 'join_match',
                player: assignedRole,
              }))
            }
            this.onMatchReady(data.match, assignedRole)
          } else if (data.type === 'match_update') {
            if (data.match) {
              this.syncMatchState(data.match)
            }
          } else if (data.type === 'sync_state') {
            if (data.match) {
              this.syncMatchState(data.match)
            }
          }
        } catch {
          // ignore parse error
        }
      }

      this.ws.onerror = () => {
        // Fallback to REST polling if WebSocket disconnects
      }
    } catch {
      // ignore
    }
  }

  private cleanupWebSocket = () => {
    if (this.ws) {
      try {
        this.ws.close()
      } catch {
        // ignore
      }
      this.ws = null
    }
  }

  // ── Leave / Resign Active Match ──────────────────────────────────────────

  leaveMatch = async () => {
    const match = this.state.activeMatch
    const myRole = this.state.myRole
    if (match && match.status === 'active' && myRole) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'leave', player: myRole }))
      } else {
        try {
          await api.resignMatch(match.id, myRole)
        } catch {
          // ignore
        }
      }
    }

    this.cleanupWebSocket()
    this.setState({
      isOnlineMatch: false,
      activeMatch: null,
      myRole: null,
    })
  }

  // ── Sync Server Match to Local State ──────────────────────────────────────

  syncMatchState = (match: MatchData) => {
    this.setState({ activeMatch: match })

    // 1. Update Royale Mode store
    const isRoyale = match.mode.includes('royale')
    royalModeStore.setGameMode(isRoyale ? 'royal' : 'classic')

    if (isRoyale) {
      royalModeStore.setState({
        wallets: {
          w: match.white_coins,
          b: match.black_coins,
        },
        shopSlots: {
          w: (match.white_shop_slots as PieceType[]) || ['p', 'n', 'b'],
          b: (match.black_shop_slots as PieceType[]) || ['p', 'n', 'b'],
        },
      })
    }

    // 2. Load board FEN into gameStore
    gameStore.loadServerFen(match.fen, match.turn as PieceColor)

    // 3. If match concluded (e.g. opponent resigned/left or checkmate)
    if (match.status === 'completed' && match.winner) {
      let winnerTitle = 'MATCH DRAW!'
      if (match.winner === 'w') winnerTitle = 'ROYAL BLUE CREW WINS!'
      if (match.winner === 'b') winnerTitle = 'CRIMSON RED CREW WINS!'

      gameStore.setGameOver({
        winner: match.winner,
        winnerTitle,
        reason: match.end_reason || 'Match Completed',
        movesCount: match.move_count,
      })
    }
  }

  // ── Online Actions Dispatcher ─────────────────────────────────────────────

  sendOnlineMove = async (from: SquareName, to: SquareName, promotion = 'q') => {
    const match = this.state.activeMatch
    if (!match) return

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'make_move',
        from,
        to,
        promotion,
      }))
    } else {
      // REST fallback
      const res = await api.submitMove(match.id, from, to, promotion)
      this.syncMatchState(res.match)
    }
  }

  sendOnlineDeploy = async (pieceType: PieceType, square: SquareName) => {
    const match = this.state.activeMatch
    const myRole = this.state.myRole
    if (!match || !myRole) return

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'deploy_piece',
        player: myRole,
        piece_type: pieceType,
        square,
      }))
    } else {
      // REST fallback
      const res = await api.deployPiece(match.id, myRole, pieceType, square)
      this.syncMatchState(res.match)
    }
  }

  sendOnlineReroll = async () => {
    const match = this.state.activeMatch
    const myRole = this.state.myRole
    if (!match || !myRole) return

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'reroll_shop',
        player: myRole,
      }))
    } else {
      // REST fallback
      const res = await api.rerollShop(match.id, myRole)
      this.syncMatchState(res.match)
    }
  }

  claimClockExpired = async () => {
    const match = this.state.activeMatch
    if (!match || match.status !== 'active') return

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'check_clock' }))
      return
    }

    try {
      this.syncMatchState(await api.checkMatchClock(match.id))
    } catch {
      // The next server sync will reconcile the displayed clock.
    }
  }
}

export const multiplayerStore = new MultiplayerStore()

export function useMultiplayerStore(): MultiplayerState {
  return useSyncExternalStore(multiplayerStore.subscribe, multiplayerStore.getState)
}

