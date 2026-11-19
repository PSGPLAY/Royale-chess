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
  const clockBaseline = useRef({ white: 600000, black: 600000, receivedAt: 0 })
  const [clockDisplay, setClockDisplay] = useState({ white: 600000, black: 600000 })
  const clockClaimedFor = useRef<string | null>(null)

  const activeMatchId = activeMatch?.id
  const matchUpdatedAt = activeMatch?.updated_at
  const whiteTimeRemaining = activeMatch?.white_time_remaining_ms
  const blackTimeRemaining = activeMatch?.black_time_remaining_ms
  const matchStatus = activeMatch?.status
  const matchTurn = activeMatch?.turn

  useEffect(() => {
    if (activeMatchId && whiteTimeRemaining !== undefined && blackTimeRemaining !== undefined) {
      clockBaseline.current = {
        white: whiteTimeRemaining,
        black: blackTimeRemaining,
        receivedAt: performance.now(),
      }
    }
    clockClaimedFor.current = null

    const interval = window.setInterval(() => {
      const baseline = clockBaseline.current
      const elapsed = matchStatus === 'active' ? Math.max(0, performance.now() - baseline.receivedAt) : 0
      setClockDisplay({
        white: Math.max(0, baseline.white - (matchStatus === 'active' && matchTurn === 'w' ? elapsed : 0)),
        black: Math.max(0, baseline.black - (matchStatus === 'active' && matchTurn === 'b' ? elapsed : 0)),
      })
    }, 200)
    return () => window.clearInterval(interval)
  }, [activeMatchId, matchUpdatedAt, whiteTimeRemaining, blackTimeRemaining, matchStatus, matchTurn])

  const whiteMs = clockDisplay.white
  const blackMs = clockDisplay.black

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
    <div className={`chess-player-banners-container ${gameMode === 'royal' ? 'has-royal-shop' : ''}`}>
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
