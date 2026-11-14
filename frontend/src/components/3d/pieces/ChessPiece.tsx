import type { FC } from 'react'
import type { UnifiedPieceProps } from './types'
import { KingPiece } from './KingPiece'
import { QueenPiece } from './QueenPiece'
import { RookPiece } from './RookPiece'
import { BishopPiece } from './BishopPiece'
import { KnightPiece } from './KnightPiece'
import { PawnPiece } from './PawnPiece'

/**
 * Unified 3D Chess Piece Component
 * Automatically resolves piece type ('k','q','r','b','n','p') and color ('w','b')
 * with correct facing orientation, pivot points, and interactive click handling.
 */
export const ChessPiece: FC<UnifiedPieceProps> = ({
  type,
  color,
  position = [0, 0, 0],
  rotation,
  scale = 1,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  // White pieces (at +Z) face up toward Black (-Z) -> rotated Math.PI
  // Black pieces (at -Z) face down toward White (+Z) -> rotation 0
  const defaultRotation: [number, number, number] = color === 'w' ? [0, Math.PI, 0] : [0, 0, 0]
  const finalRotation = rotation || defaultRotation

  // Hover or selection slight float animation
  const yOffset = isSelected ? 0.28 : isHovered ? 0.08 : 0
  const finalPosition: [number, number, number] = [position[0], position[1] + yOffset, position[2]]

  const props = {
    color,
    position: [0, 0, 0] as [number, number, number],
    rotation: finalRotation,
    scale,
    isSelected,
    isHovered,
  }

  const renderModel = () => {
    switch (type) {
      case 'k':
        return <KingPiece {...props} />
      case 'q':
        return <QueenPiece {...props} />
      case 'r':
        return <RookPiece {...props} />
      case 'b':
        return <BishopPiece {...props} />
      case 'n':
        return <KnightPiece {...props} />
      case 'p':
        return <PawnPiece {...props} />
      default:
        return null
    }
  }

  return (
    <group
      position={finalPosition}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {renderModel()}
    </group>
  )
}
