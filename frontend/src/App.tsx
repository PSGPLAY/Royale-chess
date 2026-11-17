import type { FC } from 'react'
import { useEffect } from 'react'
import { BoardScene } from './components/3d/BoardScene'
import { GameHeader } from './components/ui/GameHeader'
import { PlayerBanners } from './components/ui/PlayerBanners'
import { GameHUD } from './components/ui/GameHUD'
import { GameOverModal } from './components/ui/GameOverModal'
import { PromotionModal } from './components/ui/PromotionModal'
import { AudioControls } from './components/ui/AudioControls'
import { MoveHistoryPanel } from './components/ui/MoveHistoryPanel'
import { LandingPage } from './components/landing/LandingPage'
import { AuthModal } from './components/auth/AuthModal'
import { ProfilePage } from './components/profile/ProfilePage'
import { MatchmakingModal } from './components/multiplayer/MatchmakingModal'
import { useNavigationStore } from './state/appNavigationStore'
import { useGameStore } from './state/gameStore'
import { useGameAudio } from './audio/useGameAudio'
import { audioSettingsStore } from './audio/audioSettingsStore'
import './App.css'

/**
 * GameScreen
 * Mounts the 3D board + UI overlays and hooks up audio.
 * Kept separate so audio only starts when a match is active.
 */
const GameScreen: FC = () => {
  const { turn, isCheck, isCheckmate, isDraw, lastMove, capturedPieces, gameOver, pendingPromotion } =
    useGameStore()

  // Wire game state → sound effects (runs on every state change)
  useGameAudio({
    turn,
    isCheck,
    isCheckmate,
    isDraw,
    lastMove,
    capturedPieces,
    gameOver,
    pendingPromotion,
  })

  // Start ambient ocean loop when game screen mounts
  useEffect(() => {
    audioSettingsStore.startAmbientIfEnabled()
    return () => {
      audioSettingsStore.stopAmbient()
    }
  }, [])

  return (
    <div className="game-container">
      {/* Fullscreen Fixed Top-Down 3D WebGL Canvas */}
      <div className="canvas-wrapper">
        <BoardScene />
      </div>

      {/* Strategy Game UI Overlay */}
      <div className="ui-overlay">
        {/* Top Turn & Timeline Banner with Exit Menu */}
        <GameHeader />

        {/* Floating Chess.com-style Player Cards (Opponent at Top, You at Bottom) */}
        <PlayerBanners />

        {/* Bottom Economy & Card Shop Bar */}
        <GameHUD />
      </div>

      {/* Audio Controls Widget (top-right corner) */}
      <AudioControls />

      {/* Victory & Game Over Modal Dialog */}
      <GameOverModal />

      {/* Match Battle Log / Move History Drawer */}
      <MoveHistoryPanel />

      {/* Pawn Promotion Selector Modal */}
      <PromotionModal />
    </div>
  )
}

export const App: FC = () => {
  const { currentScreen } = useNavigationStore()

  return (
    <>
      {/* 1. Active Screen (Landing Page or 3D Match) */}
      {currentScreen === 'landing' ? <LandingPage /> : currentScreen === 'profile' ? <ProfilePage /> : <GameScreen />}

      {/* 2. Global Modals for Auth, Profile & Online Matchmaking */}
      <AuthModal />
      <MatchmakingModal />
    </>
  )
}

export default App
