import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D Queen: The Pirate Queen / Sovereign
 * Regal commander with an ornate crown, royal tricorn plume, flowing mantle, and golden corslet.
 */
export const QueenPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Queen Body & Robes (sits on pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Flared royal gown / coat base */}
        <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.42, 0.28, 18]} />
          <meshStandardMaterial color={t.primary} roughness={0.55} />
        </mesh>

        {/* Golden filigree trim on dress hem */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <torusGeometry args={[0.41, 0.02, 12, 24]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Golden Corslet / Belt */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.27, 0.31, 0.12, 16]} />
          <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.25} />
        </mesh>

        {/* Torso & Bodice */}
        <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.27, 0.28, 16]} />
          <meshStandardMaterial color={t.secondary} roughness={0.5} />
        </mesh>

        {/* Royal Mantle / Cape billowing at the back */}
        <mesh position={[0, 0.38, -0.16]} rotation={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[0.48, 0.55, 0.08]} />
          <meshStandardMaterial color={t.primary} roughness={0.7} />
        </mesh>

        {/* Pearl / Gold Royal Necklace */}
        <mesh position={[0, 0.58, 0.12]} rotation={[0.4, 0, 0]} castShadow>
          <torusGeometry args={[0.12, 0.02, 10, 16]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Royal Rapier on hip */}
        <mesh position={[0.3, 0.2, 0]} rotation={[0.3, 0, 0.3]} castShadow>
          <cylinderGeometry args={[0.015, 0.01, 0.65, 8]} />
          <meshStandardMaterial color={t.metal} metalness={0.95} roughness={0.15} />
        </mesh>
        <mesh position={[0.36, 0.44, 0]} rotation={[0.3, 0, 0.3]} castShadow>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial color={t.skin} roughness={0.6} />
        </mesh>

        {/* 3. The Queen's Golden Crown with Royal Spikes & Team Velvet Cap */}
        <group position={[0, 0.9, 0]}>
          {/* Main Crown Band */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.24, 0.22, 0.12, 16]} />
            <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Team-colored Velvet Crown Cap (Vibrant Blue or Crimson Red) */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <sphereGeometry args={[0.21, 16, 16]} />
            <meshStandardMaterial color={t.primary} roughness={0.6} />
          </mesh>

          {/* Crown Spikes (5 royal peaks) */}
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * Math.PI * 2
            const r = 0.23
            return (
              <mesh
                key={`spike-${i}`}
                position={[Math.cos(angle) * r, 0.14, Math.sin(angle) * r]}
                castShadow
              >
                <coneGeometry args={[0.05, 0.16, 8]} />
                <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
              </mesh>
            )
          })}

          {/* Central Crown Orb / Jewel */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshStandardMaterial color={t.trim} roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Royal Feather Plume drifting backward */}
          <mesh position={[0.08, 0.22, -0.1]} rotation={[-0.4, 0.2, 0.2]} castShadow>
            <boxGeometry args={[0.06, 0.32, 0.14]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  )
}

