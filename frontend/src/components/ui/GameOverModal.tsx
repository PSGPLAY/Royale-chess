import type { FC } from 'react'
import { Trophy, RotateCcw, Eye, Skull, Scale, Home, Swords } from 'lucide-react'
import { useGameStore, gameStore } from '../../state/gameStore'
import { useMultiplayerStore, multiplayerStore } from '../../state/multiplayerStore'
import { useNavigationStore, navigationStore } from '../../state/appNavigationStore'
import { audioEngine } from '../../audio/audioEngine'

const MODE_DISPLAY_NAMES: Record<string, string> = {
  ranked_royale: 'Royale Ranked',
  royale: 'Royale Strategy',
  unranked_royale: 'Royale Casual',
  ranked_normal: 'Classic Ranked',
  normal: 'Classic Normal',
  unranked_normal: 'Classic Casual',
  pvp_royale: 'Royale Pass & Play',
  pvp_normal: 'Classic Pass & Play',
}

/**
 * Victory / Game Over Popup Modal
 * Displays the winner, how they won (Checkmate, Stalemate, Draw), match stats,
 * and prominent action buttons to play again in the respective mode or return to the main menu.
 */
export const GameOverModal: FC = () => {
  const { gameOver } = useGameStore()
  const { isOnlineMatch, activeMatch } = useMultiplayerStore()
  const { activeModeId } = useNavigationStore()

  if (!gameOver) return null

  const isBlueWin = gameOver.winner === 'w'
  const isRedWin = gameOver.winner === 'b'
  const isDraw = gameOver.winner === 'draw'

  const bannerClass = isBlueWin ? 'blue-win' : isRedWin ? 'red-win' : 'draw-win'

  const currentMode = isOnlineMatch
    ? (activeMatch?.mode || 'ranked_royale')
    : (activeModeId || 'pvp_royale')

  const modeTitle = MODE_DISPLAY_NAMES[currentMode] || (currentMode.includes('royale') ? 'Royale Mode' : 'Classic Chess')

  const handleNewGame = async () => {
    audioEngine.playButtonClick()

    if (isOnlineMatch) {
      const modeToSearch = activeMatch?.mode || 'ranked_royale'
      // 1. Leave current match connection cleanly
      await multiplayerStore.leaveMatch()
      // 2. Dismiss game over & reset local state
      gameStore.dismissGameOverModal()
      gameStore.resetGame()
      // 3. Return to landing & start matchmaking for the exact same online mode
      navigationStore.returnToLanding()
      multiplayerStore.startMatchmaking(modeToSearch)
    } else {
      // Offline / Pass & Play: Relaunch with the exact same mode definition
      gameStore.dismissGameOverModal()
      navigationStore.launchGame(activeModeId || 'pvp_royale')
    }
  }

  const handleMainMenu = async () => {
    audioEngine.playButtonClick()
    if (isOnlineMatch) {
      await multiplayerStore.leaveMatch()
    }
    gameStore.dismissGameOverModal()
    gameStore.resetGame()
    navigationStore.returnToLanding()
  }

  const handleReviewBoard = () => {
    audioEngine.playButtonClick()
    gameStore.dismissGameOverModal()
  }

  return (
    <div className="game-over-overlay">
      <div className={`game-over-card ${bannerClass}`}>
        {/* Glow effect backdrop */}
        <div className="card-glow" />

        {/* 1. Header Trophy / Faction Crest */}
        <div className="trophy-wrapper">
          {isBlueWin && <Trophy size={56} className="victory-icon blue" />}
          {isRedWin && <Skull size={56} className="victory-icon red" />}
          {isDraw && <Scale size={56} className="victory-icon draw" />}
        </div>

        {/* 2. Winner Announcement */}
        <div className="announcement-block">
          <span className="victory-subtitle">
            {isDraw ? 'BATTLE CONCLUDED' : 'VICTORY ACHIEVED'}
          </span>
          <h2 className="winner-headline">{gameOver.winnerTitle}</h2>
          <div className="win-reason-badge">
            <span>By {gameOver.reason}</span>
          </div>
        </div>

        {/* 3. Match Stats */}
        <div className="match-stats-row">
          <div className="stat-box">
            <span className="stat-label">Total Moves</span>
            <span className="stat-value">{gameOver.movesCount}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Game Mode</span>
            <span className="stat-value">{modeTitle}</span>
          </div>
        </div>

        {/* 4. Action Buttons */}
        <div className="modal-actions-container">
          {/* Primary Action: Search respective mode or play again */}
          <button
            className="btn-primary-newgame"
            onClick={handleNewGame}
          >
            {isOnlineMatch ? <Swords size={18} /> : <RotateCcw size={18} />}
            <span>{isOnlineMatch ? `Find Next Match (${modeTitle})` : `Play Again (${modeTitle})`}</span>
          </button>

          {/* Secondary Actions: Main Menu & Review Board */}
          <div className="modal-secondary-actions-row">
            <button
              className="btn-secondary-menu"
              onClick={handleMainMenu}
              title="Return to Main Menu"
            >
              <Home size={16} />
              <span>Main Menu</span>
            </button>

            <button
              className="btn-secondary-review"
              onClick={handleReviewBoard}
              title="Inspect Final Board Position"
            >
              <Eye size={16} />
              <span>Review Board</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

