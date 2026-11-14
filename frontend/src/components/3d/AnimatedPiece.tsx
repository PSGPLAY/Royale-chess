import type { FC } from 'react'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlacedChessPiece } from '../../types/chess'
import { squareToWorld, TILE_HEIGHT } from '../../utils/boardCoordinates'
import { ChessPiece } from './pieces'
import { gameStore } from '../../state/gameStore'
import type { AnimatingPiece } from '../../state/gameStore'

interface AnimatedPieceProps {
  piece: PlacedChessPiece
  isSelected: boolean
  animatingPiece: AnimatingPiece | null
}

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * 3D Chess Piece with smooth cubic interpolation and parabolic jump arc
 */
export const AnimatedPiece: FC<AnimatedPieceProps> = ({
  piece,
  isSelected,
  animatingPiece,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const isMoving = animatingPiece?.pieceId === piece.id

  const basePos = squareToWorld(piece.square, TILE_HEIGHT)

  useFrame(() => {
    if (!groupRef.current) return

    if (isMoving && animatingPiece) {
      const elapsed = performance.now() - animatingPiece.startTime
      const linearProgress = Math.min(1, Math.max(0, elapsed / animatingPiece.duration))
      const progress = easeInOutCubic(linearProgress)

      // Linear interpolation between starting position and target position
      const x = THREE.MathUtils.lerp(animatingPiece.fromPos[0], animatingPiece.toPos[0], progress)
      const z = THREE.MathUtils.lerp(animatingPiece.fromPos[2], animatingPiece.toPos[2], progress)

      // Parabolic jump arc: lifts the piece during transit like a real player moving it
      const jumpHeight = Math.sin(progress * Math.PI) * 0.45
      const y = TILE_HEIGHT + jumpHeight

      groupRef.current.position.set(x, y, z)
    } else {
      // Resting position (with slight float if selected)
      const targetY = isSelected ? TILE_HEIGHT + 0.28 : TILE_HEIGHT
      groupRef.current.position.set(basePos[0], targetY, basePos[2])
    }
  })

  return (
    <group
      ref={groupRef}
      position={[basePos[0], basePos[1] + (isSelected ? 0.28 : 0), basePos[2]]}
      onClick={(e) => {
        e.stopPropagation()
        gameStore.handleSquareClick(piece.square)
      }}
    >
      <ChessPiece
        type={piece.type}
        color={piece.color}
        position={[0, 0, 0]}
        isSelected={false} // Position handled at group level
      />
    </group>
  )
}

