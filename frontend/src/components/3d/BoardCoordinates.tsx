import type { FC } from 'react'
import { Text } from '@react-three/drei'
import { FILES, RANKS, TILE_SIZE, gridToWorld } from '../../utils/boardCoordinates'

interface BoardCoordinatesProps {
  visible?: boolean
}

/**
 * Coordinate markers along the board perimeter matching the reference image:
 * Files A-H across the bottom, Ranks 1-8 up the left side.
 */
export const BoardCoordinates: FC<BoardCoordinatesProps> = ({ visible = true }) => {
  if (!visible) return null

  // Fixed text styling matching the chunky cartoon white font in reference
  const fontSize = 0.55
  const fontColor = '#ffffff'
  const yPos = 0.24 // Sit on top of the board frame

  return (
    <group>
      {/* File Letters (A - H) along the bottom rank (rank 1) */}
      {FILES.map((file, fileIdx) => {
        const [x, , z] = gridToWorld(fileIdx, 0)
        // Position on the wooden rim in front (rank 1 side)
        const offsetZ = z + TILE_SIZE * 0.72

        return (
          <Text
            key={`file-${file}`}
            position={[x, yPos, offsetZ]}
            rotation={[-Math.PI / 2 + 0.36, 0, 0]}
            fontSize={fontSize}
            color={fontColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#3d2a1b"
          >
            {file.toUpperCase()}
          </Text>
        )
      })}

      {/* Rank Numbers (1 - 8) along the left file (file A) */}
      {RANKS.map((rank, rankIdx) => {
        const [x, , z] = gridToWorld(0, rankIdx)
        // Position on the wooden rim to the left (file A side)
        const offsetX = x - TILE_SIZE * 0.72

        return (
          <Text
            key={`rank-${rank}`}
            position={[offsetX, yPos, z]}
            rotation={[-Math.PI / 2 + 0.36, 0, 0]}
            fontSize={fontSize}
            color={fontColor}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#3d2a1b"
          >
            {rank}
          </Text>
        )
      })}
    </group>
  )
}
