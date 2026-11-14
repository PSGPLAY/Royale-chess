import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D Knight: The Royal Cavalier / Seahorse War Steed
 * Sculpted equine knight head with flowing mane, armored war bridle, and team heraldic crest.
 */
export const KnightPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Knight Steed Body & Head (sits on pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Chest / Base of neck */}
        <mesh position={[0, 0.16, 0.05]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.38, 0.32, 16]} />
          <meshStandardMaterial color={t.secondary} roughness={0.6} />
        </mesh>

        {/* Heraldic Team Shield on front chest (matches card 3 in reference image) */}
        <group position={[0, 0.22, 0.28]} rotation={[-0.1, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.24, 0.3, 0.05]} />
            <meshStandardMaterial color={t.primary} roughness={0.4} />
          </mesh>
          {/* Gold shield border */}
          <mesh position={[0, 0, 0.02]} castShadow>
            <boxGeometry args={[0.26, 0.32, 0.02]} />
            <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Emblem on shield */}
          <mesh position={[0, 0.04, 0.035]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </group>

        {/* Arching Equine Neck */}
        <mesh position={[0, 0.44, 0.08]} rotation={[0.4, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.24, 0.4, 0.3]} />
          <meshStandardMaterial color={t.secondary} roughness={0.6} />
        </mesh>

        {/* Flowing Mane along the back of the neck - Team Secondary */}
        <mesh position={[0, 0.46, -0.1]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.1, 0.42, 0.14]} />
          <meshStandardMaterial color={t.secondary} roughness={0.5} />
        </mesh>

        {/* Head / Forehead - Team Primary */}
        <mesh position={[0, 0.68, 0.16]} rotation={[0.7, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.3, 0.25]} />
          <meshStandardMaterial color={t.primary} roughness={0.5} />
        </mesh>

        {/* Muzzle / Jaw pointing forward and slightly down - Team Primary */}
        <mesh position={[0, 0.58, 0.35]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.26]} />
          <meshStandardMaterial color={t.primary} roughness={0.5} />
        </mesh>

        {/* Nostrils & Brow */}
        <mesh position={[0, 0.54, 0.48]} castShadow>
          <boxGeometry args={[0.14, 0.08, 0.06]} />
          <meshStandardMaterial color={t.leather} roughness={0.8} />
        </mesh>

        {/* Equine Eyes */}
        <mesh position={[-0.12, 0.68, 0.2]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.12, 0.68, 0.2]} castShadow>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Alert Pricked Ears - Team Primary */}
        <mesh position={[-0.08, 0.88, 0.06]} rotation={[0.2, 0, -0.2]} castShadow>
          <coneGeometry args={[0.05, 0.18, 8]} />
          <meshStandardMaterial color={t.primary} roughness={0.5} />
        </mesh>
        <mesh position={[0.08, 0.88, 0.06]} rotation={[0.2, 0, 0.2]} castShadow>
          <coneGeometry args={[0.05, 0.18, 8]} />
          <meshStandardMaterial color={t.primary} roughness={0.5} />
        </mesh>

        {/* Armored Bridle & Bit */}
        <mesh position={[0, 0.62, 0.3]} rotation={[0.4, 0, 0]} castShadow>
          <torusGeometry args={[0.12, 0.018, 8, 16]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  )
}
