import type { FC } from 'react'
import { useEffect } from 'react'
import { BoardScene } from '../3d/BoardScene'
import { GameHeader } from '../ui/GameHeader'
import { PlayerBanners } from '../ui/PlayerBanners'
import { GameHUD } from '../ui/GameHUD'
import { GameOverModal } from '../ui/GameOverModal'
import { PromotionModal } from '../ui/PromotionModal'
import { AudioControls } from '../ui/AudioControls'
import { MoveHistoryPanel } from '../ui/MoveHistoryPanel'
import { useGameStore } from '../../state/gameStore'
import { useGameAudio } from '../../audio/useGameAudio'
import { audioSettingsStore } from '../../audio/audioSettingsStore'

const GameScreen: FC = () => {
  const { turn, isCheck, isCheckmate, isDraw, lastMove, capturedPieces, gameOver, pendingPromotion } =
    useGameStore()

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

  useEffect(() => {
    audioSettingsStore.startAmbientIfEnabled()
    return () => audioSettingsStore.stopAmbient()
  }, [])

  return (
    <div className="game-container">
      <div className="canvas-wrapper">
        <BoardScene />
      </div>
      <div className="ui-overlay">
        <GameHeader />
        <PlayerBanners />
        <GameHUD />
      </div>
      <AudioControls />
      <GameOverModal />
      <MoveHistoryPanel />
      <PromotionModal />
    </div>
  )
}

export default GameScreen
