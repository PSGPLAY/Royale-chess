import type { FC } from 'react'
import { useMemo } from 'react'
import { Square } from './Square'
import { BoardCoordinates } from './BoardCoordinates'
import { BoardEnvironment } from './BoardEnvironment'
import { AnimatedPiece } from './AnimatedPiece'
import {
  generateBoardSquares,
  PIRATE_COVE_THEME,
  BOARD_SIZE,
  TILE_HEIGHT,
} from '../../utils/boardCoordinates'
import { useGameStore } from '../../state/gameStore'
import { useBoardStore } from '../../state/boardStore'
import { useRoyalModeStore } from '../../royal/royalModeStore'

export const Chessboard: FC = () => {
  const squares = useMemo(() => generateBoardSquares(), [])
  const { pieces, selectedSquare, validMoves, lastMove, animatingPiece } = useGameStore()
  const { showLabels } = useBoardStore()
  const { placementSquares, selectedShopPiece } = useRoyalModeStore()

  // Squares occupied by pieces
  const occupiedSquares = useMemo(() => new Set(pieces.map((p) => p.square)), [pieces])

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Surrounding 3D Environment (Dock, sand, posts, barrels, ropes, cutlass) */}
      <BoardEnvironment />

      {/* 2. Solid Wooden Board Frame Tray */}
      <mesh position={[0, TILE_HEIGHT / 2 - 0.05, 0]} receiveShadow castShadow>
        <boxGeometry args={[BOARD_SIZE + 0.9, TILE_HEIGHT + 0.06, BOARD_SIZE + 0.9]} />
        <meshStandardMaterial color="#422513" roughness={0.7} />
      </mesh>

      {/* 3. The 64 Board Checkered Squares */}
      <group position={[0, 0, 0]}>
        {squares.map((sq) => {
          const isSelected = selectedSquare === sq.name
          const isTarget = validMoves.includes(sq.name)
          const isLast = lastMove?.from === sq.name || lastMove?.to === sq.name
          const isCapture = isTarget && occupiedSquares.has(sq.name)
          const isPlacement = selectedShopPiece !== null && placementSquares.includes(sq.name)

          return (
            <Square
              key={sq.name}
              square={sq}
              theme={PIRATE_COVE_THEME}
              isSelected={isSelected}
              isTarget={isTarget}
              isLastMove={isLast}
              isCaptureTarget={isCapture}
              isPlacementSquare={isPlacement}
            />
          )
        })}
      </group>

      {/* 4. Board Coordinate Labels (A-H, 1-8) */}
      <BoardCoordinates visible={showLabels} />

      {/* 5. The Live Animated 3D Chess Pieces */}
      <group position={[0, 0, 0]}>
        {pieces.map((piece) => (
          <AnimatedPiece
            key={piece.id}
            piece={piece}
            isSelected={selectedSquare === piece.square}
            animatingPiece={animatingPiece}
          />
        ))}
      </group>
    </group>
  )
}
