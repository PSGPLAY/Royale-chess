import type { FC } from 'react'
import { Trophy, Coins, Swords } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../../state/gameStore'
import { multiplayerStore, useMultiplayerStore } from '../../state/multiplayerStore'
import { useAuthStore } from '../../state/authStore'
import { useRoyalModeStore } from '../../royal/royalModeStore'
import { getGuestDisplayName } from '../../utils/guestSession'
import type { PieceColor } from '../../types/chess'

export const PlayerBanners: FC = () => {
  const { turn, capturedPieces } = useGameStore()
  const { isOnlineMatch, myRole, activeMatch } = useMultiplayerStore()
  const { user } = useAuthStore()
  const { gameMode, wallets } = useRoyalModeStore()
  const [clockNow, setClockNow] = useState(Date.now())
  const [clockBaseline, setClockBaseline] = useState({ white: 600000, black: 600000, receivedAt: Date.now() })
  const clockClaimedFor = useRef<string | null>(null)

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(Date.now()), 200)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!activeMatch) return
    setClockBaseline({
      white: activeMatch.white_time_remaining_ms,
      black: activeMatch.black_time_remaining_ms,
      receivedAt: Date.now(),
    })
    clockClaimedFor.current = null
  }, [activeMatch?.id, activeMatch?.updated_at, activeMatch?.white_time_remaining_ms, activeMatch?.black_time_remaining_ms])

  const elapsed = activeMatch?.status === 'active' && activeMatch.turn === 'w'
    ? Math.max(0, clockNow - clockBaseline.receivedAt)
    : activeMatch?.status === 'active' && activeMatch.turn === 'b'
      ? Math.max(0, clockNow - clockBaseline.receivedAt)
      : 0
  const whiteMs = Math.max(0, clockBaseline.white - (activeMatch?.turn === 'w' ? elapsed : 0))
  const blackMs = Math.max(0, clockBaseline.black - (activeMatch?.turn === 'b' ? elapsed : 0))

  useEffect(() => {
    if (!activeMatch || activeMatch.status !== 'active') return
    const currentMs = activeMatch.turn === 'w' ? whiteMs : blackMs
    const claimKey = `${activeMatch.id}:${activeMatch.updated_at}`
    if (currentMs === 0 && clockClaimedFor.current !== claimKey) {
      clockClaimedFor.current = claimKey
      void multiplayerStore.claimClockExpired()
    }
  }, [activeMatch, whiteMs, blackMs])

  const formatClock = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000)
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
  }

  // Determine who is player (bottom) and who is opponent (top)
  const myColor: PieceColor = isOnlineMatch && myRole ? myRole : 'w'
  const opponentColor: PieceColor = myColor === 'w' ? 'b' : 'w'

  // Names
  const myName = isOnlineMatch
    ? (myRole === 'w' ? activeMatch?.white_username : activeMatch?.black_username) || (user?.nickname || user?.username || getGuestDisplayName())
    : (user?.nickname || user?.username || `${getGuestDisplayName()} (Blue)`)

  const opponentName = isOnlineMatch
    ? (myRole === 'w' ? activeMatch?.black_username : activeMatch?.white_username) || 'Opponent'
    : 'Red Commander'

  const myElo = user?.rating_elo ? `${user.rating_elo}` : 'Guest'
  const opponentElo = isOnlineMatch ? 'Ranked' : 'Normal'

  const isMyTurn = turn === myColor
  const isOpponentTurn = turn === opponentColor

  return (
    <div className="chess-player-banners-container">
      {/* ── Top Player Banner: Opponent ── */}
      <div className={`player-banner opponent-banner ${opponentColor === 'w' ? 'banner-blue' : 'banner-red'} ${isOpponentTurn ? 'active-turn' : ''}`}>
        <div className="banner-avatar-wrap">
          <div className="banner-avatar">
            <span className="avatar-flag">{opponentColor === 'w' ? '👑' : '🏴‍☠️'}</span>
          </div>
          {isOpponentTurn && <div className="turn-pulse-dot" title="Active Turn" />}
        </div>

        <div className="banner-info">
          <div className="banner-name-row">
            <span className="banner-username" title={opponentName}>{opponentName}</span>
            <span className="banner-elo-tag">
              <Trophy size={11} /> {opponentElo}
            </span>
          </div>
          <div className="banner-meta-row">
            <span className="banner-team-badge">
              {opponentColor === 'w' ? 'Royal Blue' : 'Crimson Red'}
            </span>
            {gameMode === 'royal' && (
              <span className="banner-coins-pill">
                <Coins size={11} className="coin-icon" /> {wallets[opponentColor]}
              </span>
            )}
            {isOnlineMatch && activeMatch && (
              <span className={`banner-clock ${opponentColor === activeMatch.turn ? 'clock-running' : ''} ${(opponentColor === 'w' ? whiteMs : blackMs) <= 60000 ? 'clock-low' : ''}`}>
                {formatClock(opponentColor === 'w' ? whiteMs : blackMs)}
              </span>
            )}
            {/* Captured by opponent */}
            {capturedPieces[opponentColor]?.length > 0 && (
              <span className="banner-captures" title="Captured pieces">
                {capturedPieces[opponentColor].map((p, idx) => (
                  <span key={idx} className="captured-piece-sym">
                    {p.toUpperCase()}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {isOpponentTurn && (
          <div className="banner-thinking-pill">
            <Swords size={12} className="spin-icon" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* ── Bottom Player Banner: Current Player (You) ── */}
      <div className={`player-banner player-banner-bottom ${myColor === 'w' ? 'banner-blue' : 'banner-red'} ${isMyTurn ? 'active-turn' : ''}`}>
        <div className="banner-avatar-wrap">
          <div className="banner-avatar">
            <span className="avatar-flag">{myColor === 'w' ? '👑' : '🏴‍☠️'}</span>
          </div>
          {isMyTurn && <div className="turn-pulse-dot" title="Active Turn" />}
        </div>

        <div className="banner-info">
          <div className="banner-name-row">
            <span className="banner-username" title={myName}>
              {myName} {isOnlineMatch && <small className="you-tag">(You)</small>}
            </span>
            <span className="banner-elo-tag">
              <Trophy size={11} /> {myElo}
            </span>
          </div>
          <div className="banner-meta-row">
            <span className="banner-team-badge">
              {myColor === 'w' ? 'Royal Blue' : 'Crimson Red'}
            </span>
            {gameMode === 'royal' && (
              <span className="banner-coins-pill">
                <Coins size={11} className="coin-icon" /> {wallets[myColor]}
              </span>
            )}
            {isOnlineMatch && activeMatch && (
              <span className={`banner-clock ${myColor === activeMatch.turn ? 'clock-running' : ''} ${(myColor === 'w' ? whiteMs : blackMs) <= 60000 ? 'clock-low' : ''}`}>
                {formatClock(myColor === 'w' ? whiteMs : blackMs)}
              </span>
            )}
            {/* Captured by player */}
            {capturedPieces[myColor]?.length > 0 && (
              <span className="banner-captures" title="Captured pieces">
                {capturedPieces[myColor].map((p, idx) => (
                  <span key={idx} className="captured-piece-sym">
                    {p.toUpperCase()}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>

        {isMyTurn && (
          <div className="banner-thinking-pill my-turn-pill">
            <span>Your Turn</span>
          </div>
        )}
      </div>
    </div>
  )
}
