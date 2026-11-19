import type { FC } from 'react'
import { RotateCcw, Home, ScrollText, Flag } from 'lucide-react'
import { useGameStore, gameStore } from '../../state/gameStore'
import { useBoardStore, boardStore } from '../../state/boardStore'
import { useRoyalModeStore } from '../../royal/royalModeStore'
import { navigationStore, useNavigationStore } from '../../state/appNavigationStore'
import { useMultiplayerStore, multiplayerStore } from '../../state/multiplayerStore'
import { GAME_MODES } from '../../state/gameModeConfig'

/**
 * Top turn & action timeline bar inspired directly by the reference image.
 * Shows live dynamic action history and quick access to the full battle log.
 */
export const GameHeader: FC = () => {
  const { selectedSquare, statusMessage, isCheck, isCheckmate, moveHistory } = useGameStore()
  const { hoveredSquare, isHistoryOpen } = useBoardStore()
  const { gameMode } = useRoyalModeStore()
  const { activeModeId } = useNavigationStore()
  const { isOnlineMatch, myRole, activeMatch } = useMultiplayerStore()

  const currentMode = GAME_MODES.find((m) => m.id === activeModeId)

  const opponentName = myRole === 'w'
    ? (activeMatch?.black_username || 'Red Player')
    : (activeMatch?.white_username || 'Blue Player')

  const handleExitMenu = async () => {
    if (isOnlineMatch && activeMatch && activeMatch.status === 'active') {
      const confirmLeave = window.confirm('Leave active battle? You will forfeit the match to your opponent.')
      if (!confirmLeave) return
      await multiplayerStore.leaveMatch()
    } else if (isOnlineMatch) {
      await multiplayerStore.leaveMatch()
    }
    gameStore.dismissGameOverModal()
    gameStore.resetGame()
    navigationStore.returnToLanding()
  }

  const handleResign = async () => {
    const confirmResign = window.confirm('Surrender this battle? Your opponent will claim victory.')
    if (confirmResign) {
      await multiplayerStore.leaveMatch()
    }
  }

  return (
    <header className="game-header-banner">
      {/* Return to Landing Page / Main Menu */}
      <div className="header-left-actions">
        <button
          className="btn-exit-menu"
          onClick={handleExitMenu}
          title="Return to Game Modes Menu"
        >
          <Home size={15} />
          <span>Menu</span>
        </button>

        {isOnlineMatch && activeMatch?.status === 'active' && (
          <button
            className="btn-header-resign"
            onClick={handleResign}
            title="Surrender / Resign Battle"
          >
            <Flag size={14} />
            <span>Resign</span>
          </button>
        )}

        <div className={`active-mode-badge ${gameMode === 'royal' ? 'royal-badge' : 'normal-badge'}`}>
          <span>
            {isOnlineMatch
              ? `🌐 Online: ${myRole === 'w' ? 'Blue' : 'Red'} vs ${opponentName}`
              : currentMode?.title || (gameMode === 'royal' ? 'Royale Mode' : 'Normal Chess')}
          </span>
        </div>
      </div>

      {/* Dynamic Live Action Timeline Strip */}
      <div className="timeline-strip">
        {moveHistory.length === 0 ? (
          <div className="timeline-empty-hint">
            <span>⚔️ Awaiting First Action...</span>
          </div>
        ) : (
          moveHistory.slice(-14).map((entry, idx, arr) => {
            const isSelected = selectedSquare && selectedSquare.toLowerCase() === entry.toSquare.toLowerCase()
            const teamClass = entry.player === 'w' ? 'blue' : 'red'

            return (
              <div
                key={entry.id}
                className={`timeline-shield ${teamClass} ${isSelected ? 'highlight' : ''}`}
                title={entry.description}
                onClick={() => {
                  if (entry.toSquare !== '--') {
                    boardStore.selectSquare(entry.toSquare)
                  }
                }}
              >
                <div className="shield-icon">{entry.icon}</div>
                <span className="shield-coord">{entry.toSquare.toUpperCase()}</span>
                {idx < arr.length - 1 && <span className="timeline-arrow">›</span>}
              </div>
            )
          })
        )}
      </div>

      <div className="header-status-group">
        {/* Toggle Battle Log & Move History Panel */}
        <button
          className={`btn-history-toggle ${isHistoryOpen ? 'active' : ''}`}
          onClick={() => boardStore.toggleHistory()}
          title="Open Match Action History Log"
        >
          <ScrollText size={14} />
          <span>Log ({moveHistory.length})</span>
        </button>

        <div className={`status-pill ${isCheckmate ? 'danger' : isCheck ? 'warning' : ''}`}>
          <span>{statusMessage}</span>
        </div>

        <div className="board-info-pill">
          <span className="label">Square:</span>
          <span className="value">{selectedSquare ? selectedSquare.toUpperCase() : '--'}</span>
          {hoveredSquare && (
            <>
              <span className="separator">|</span>
              <span className="label">Hover:</span>
              <span className="value hover-val">{hoveredSquare.toUpperCase()}</span>
            </>
          )}
        </div>

        <button
          className="reset-match-btn"
          onClick={async () => {
            if (isOnlineMatch) {
              const currentOnlineMode = activeMatch?.mode || 'ranked_royale'
              if (activeMatch && activeMatch.status === 'active') {
                const confirmRestart = window.confirm('Leave active battle and search for a new opponent?')
                if (!confirmRestart) return
              }
              await multiplayerStore.leaveMatch()
              gameStore.dismissGameOverModal()
              gameStore.resetGame()
              navigationStore.returnToLanding()
              multiplayerStore.startMatchmaking(currentOnlineMode)
            } else {
              gameStore.dismissGameOverModal()
              navigationStore.launchGame(activeModeId || 'pvp_royale')
            }
          }}
          title={isOnlineMatch ? "Find New Online Opponent" : "Restart Match"}
        >
          <RotateCcw size={14} />
          <span>{isOnlineMatch ? 'New Match' : 'Restart'}</span>
        </button>
      </div>
    </header>
  )
}
