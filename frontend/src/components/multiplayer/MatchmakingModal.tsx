import type { FC } from 'react'
import { X, Compass, Loader2 } from 'lucide-react'
import { useMultiplayerStore, multiplayerStore } from '../../state/multiplayerStore'
import { audioEngine } from '../../audio/audioEngine'

export const MatchmakingModal: FC = () => {
  const { isSearching, searchElapsedSeconds, searchMode, error } = useMultiplayerStore()

  if (!isSearching) return null

  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = () => {
    audioEngine.playButtonClick()
    multiplayerStore.cancelMatchmaking()
  }

  const isRoyale = searchMode.includes('royale')

  const MODE_TITLES: Record<string, string> = {
    ranked_royale: '👑 Royale Strategy (Ranked)',
    royale: '👑 Royale Strategy (Ranked)',
    unranked_royale: '⚔️ Royale Casual (Unranked)',
    ranked_normal: '♟️ Classic Chess (Ranked)',
    normal: '♟️ Classic Chess (Casual)',
    unranked_normal: '☕ Classic Casual (Unranked)',
  }
  const modeLabel = MODE_TITLES[searchMode] || (isRoyale ? '👑 Royale Strategy' : '♟️ Normal Chess')

  return (
    <div className="matchmaking-overlay">
      <div className="matchmaking-card">
        {/* Pulsing Radar Ring */}
        <div className="radar-container">
          <div className="radar-pulse-ring ring-1" />
          <div className="radar-pulse-ring ring-2" />
          <div className="radar-pulse-ring ring-3" />
          <div className="radar-center-icon">
            <Compass size={40} className="spinning-compass" />
          </div>
        </div>

        {/* Status text */}
        <div className="matchmaking-text-group">
          <h3 className="matchmaking-title">Searching for an opponent...</h3>
          <p className="matchmaking-sub">Searching for an opponent in {modeLabel}</p>
        </div>

        {/* Timer & Mode Pill */}
        <div className="matchmaking-status-pill">
          <Loader2 size={15} className="spin-fast" />
          <span className="search-timer">{formatSeconds(searchElapsedSeconds)}</span>
          <span className="pill-divider">•</span>
          <span className="search-mode-tag">{modeLabel}</span>
        </div>

        {error && (
          <div className="matchmaking-error">
            <span>{error}</span>
          </div>
        )}

        {/* Cancel Button */}
        <button className="btn-cancel-search" onClick={handleCancel}>
          <X size={16} />
          <span>Cancel Search</span>
        </button>
      </div>
    </div>
  )
}
