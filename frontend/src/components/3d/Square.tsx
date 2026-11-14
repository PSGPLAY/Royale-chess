import type { FC } from 'react'
import { useRef, useState } from 'react'
import type * as THREE from 'three'
import type { BoardSquareInfo, BoardTheme } from '../../types/chess'
import { TILE_SIZE, TILE_HEIGHT } from '../../utils/boardCoordinates'
import { gameStore } from '../../state/gameStore'
import { boardStore } from '../../state/boardStore'

interface SquareProps {
  square: BoardSquareInfo
  theme: BoardTheme
  isSelected: boolean
  isTarget: boolean
  isLastMove?: boolean
  isCaptureTarget?: boolean
  isPlacementSquare?: boolean
}

/**
 * 3D Square tile with tactile beveling, hover highlight,
 * reference-accurate 4-corner selection brackets, and stylized blue 'X' move indicators.
 */
export const Square: FC<SquareProps> = ({
  square,
  theme,
  isSelected,
  isTarget,
  isLastMove,
  isCaptureTarget,
  isPlacementSquare,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null)

  // Color selection
  let baseColor = square.isDark ? theme.darkSquareColor : theme.lightSquareColor

  if (isSelected) {
    baseColor = theme.selectedSquareColor
  } else if (isPlacementSquare) {
    baseColor = square.isDark ? '#59381c' : '#faedcc'
  } else if (isLastMove) {
    baseColor = square.isDark ? '#a8784e' : '#f7e3c3'
  } else if (isHovered) {
    baseColor = square.isDark ? theme.darkSquareHover : theme.lightSquareHover
  }

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    gameStore.handleSquareClick(square.name)
  }

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    setIsHovered(true)
    boardStore.setHoveredSquare(square.name)
  }

  const handlePointerOut = () => {
    setIsHovered(false)
    boardStore.setHoveredSquare(null)
  }

  const tileWidth = TILE_SIZE * 0.985
  const halfHeight = TILE_HEIGHT / 2

  return (
    <group position={square.worldPosition}>
      {/* Physical 3D Tile Mesh */}
      <mesh
        ref={meshRef}
        position={[0, halfHeight, 0]}
        receiveShadow
        castShadow
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[tileWidth, TILE_HEIGHT, tileWidth]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Selected Tile: Stylized Corner Brackets (matching reference C3 selection) */}
      {isSelected && (
        <group position={[0, TILE_HEIGHT + 0.01, 0]}>
          <BracketCorner posX={-0.5} posZ={-0.5} rotY={0} />
          <BracketCorner posX={0.5} posZ={-0.5} rotY={-Math.PI / 2} />
          <BracketCorner posX={0.5} posZ={0.5} rotY={Math.PI} />
          <BracketCorner posX={-0.5} posZ={0.5} rotY={Math.PI / 2} />
        </group>
      )}

      {/* Target Move Tile: Stylized Blue 'X' (matching reference move indicators) */}
      {isTarget && (
        <group position={[0, TILE_HEIGHT + 0.015, 0]}>
          <group rotation={[0, Math.PI / 4, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[0.72, 0.04, 0.22]} />
              <meshStandardMaterial
                color={isCaptureTarget ? '#dc2626' : '#2563eb'}
                emissive={isCaptureTarget ? '#991b1b' : '#1d4ed8'}
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
            <mesh receiveShadow>
              <boxGeometry args={[0.22, 0.04, 0.72]} />
              <meshStandardMaterial
                color={isCaptureTarget ? '#dc2626' : '#2563eb'}
                emissive={isCaptureTarget ? '#991b1b' : '#1d4ed8'}
                emissiveIntensity={0.3}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Royal Mode: Deployment Placement Ring */}
      {isPlacementSquare && (
        <group position={[0, TILE_HEIGHT + 0.015, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.46, 24]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.6}
              roughness={0.2}
            />
          </mesh>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 16]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.7}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

function BracketCorner({
  posX,
  posZ,
  rotY,
}: {
  posX: number
  posZ: number
  rotY: number
}) {
  const span = 0.55 * TILE_SIZE
  const thickness = 0.08
  const length = 0.32
  const height = 0.05

  return (
    <group position={[posX * span, 0, posZ * span]} rotation={[0, rotY, 0]}>
      {/* Horizontal segment */}
      <mesh position={[length / 2, height / 2, 0]}>
        <boxGeometry args={[length, height, thickness]} />
        <meshStandardMaterial color="#2d72d9" emissive="#1b4991" emissiveIntensity={0.5} />
      </mesh>
      {/* Vertical segment */}
      <mesh position={[0, height / 2, length / 2]}>
        <boxGeometry args={[thickness, height, length]} />
        <meshStandardMaterial color="#2d72d9" emissive="#1b4991" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}
