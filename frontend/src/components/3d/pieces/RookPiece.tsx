import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D Rook: The Naval Citadel / Cannon Bastion
 * Fully team-colored coastal fortress tower (Vibrant Blue or Crimson Red)
 * with battlements, golden corbels, and a bronze naval cannon.
 */
export const RookPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Fortress Tower Body (sits on pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Tower lower masonry slope - Team Secondary */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.36, 0.44, 0.24, 20]} />
          <meshStandardMaterial color={t.secondary} roughness={0.65} />
        </mesh>

        {/* Lower gold trim ring */}
        <mesh position={[0, 0.24, 0]} castShadow>
          <torusGeometry args={[0.365, 0.02, 10, 20]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Tower main shaft - Team Primary */}
        <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.33, 0.36, 0.38, 20]} />
          <meshStandardMaterial color={t.primary} roughness={0.6} />
        </mesh>

        {/* Upper flared corbel / machicolation - Team Secondary */}
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.33, 0.14, 20]} />
          <meshStandardMaterial color={t.secondary} roughness={0.65} />
        </mesh>

        {/* Gold battlement support ring */}
        <mesh position={[0, 0.69, 0]} castShadow>
          <torusGeometry args={[0.425, 0.025, 10, 20]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* 3. Castle Crenellations / Battlements */}
        <group position={[0, 0.74, 0]}>
          {/* Floor of the battlement */}
          <mesh position={[0, -0.04, 0]} receiveShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.08, 16]} />
            <meshStandardMaterial color={t.secondary} roughness={0.7} />
          </mesh>

          {/* 4 Merlons spaced around perimeter - Team Primary */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i * Math.PI) / 2 + Math.PI / 4
            const r = 0.32
            return (
              <mesh
                key={`merlon-${i}`}
                position={[Math.cos(angle) * r, 0.08, Math.sin(angle) * r]}
                rotation={[0, -angle, 0]}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[0.22, 0.18, 0.12]} />
                <meshStandardMaterial color={t.primary} roughness={0.55} />
              </mesh>
            )
          })}

          {/* Heavy Bronze Naval Cannon peering through the front battlement */}
          <group position={[0, 0.06, 0.16]} rotation={[0.05, 0, 0]}>
            {/* Cannon barrel */}
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 0.36, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Muzzle ring */}
            <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <torusGeometry args={[0.075, 0.02, 8, 16]} />
              <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Muzzle bore */}
            <mesh position={[0, 0, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.05, 12]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
