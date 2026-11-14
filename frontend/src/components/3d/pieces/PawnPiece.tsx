import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D Pawn: The Deckhand Sailor / Crewman
 * Inspired directly by the crew units (C3, H5, D1, A4, F6) in the reference image.
 */
export const PawnPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Character Torso / Vest (sits on top of pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Belt & Buckle */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.31, 0.32, 0.1, 16]} />
          <meshStandardMaterial color={t.leather} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.08, 0.3]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.04]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Vest / Body */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.3, 0.3, 16]} />
          <meshStandardMaterial color={t.primary} roughness={0.6} />
        </mesh>

        {/* White shirt insert */}
        <mesh position={[0, 0.32, 0.18]} castShadow>
          <boxGeometry args={[0.14, 0.2, 0.1]} />
          <meshStandardMaterial color={t.fabric} roughness={0.5} />
        </mesh>

        {/* Cutlass scabbard on left hip */}
        <mesh position={[-0.32, 0.12, 0]} rotation={[0.2, 0, -0.4]} castShadow>
          <boxGeometry args={[0.06, 0.45, 0.1]} />
          <meshStandardMaterial color={t.leather} roughness={0.7} />
        </mesh>
        <mesh position={[-0.43, 0.34, 0]} rotation={[0.2, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.14, 8]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 0.47, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.13, 0.08, 12]} />
          <meshStandardMaterial color={t.skin} roughness={0.6} />
        </mesh>

        {/* Stylized Head */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={t.skin} roughness={0.6} />
        </mesh>

        {/* Sailor Bandana / Peaked Cap (Signature look from reference) - Team Primary */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.21, 0.16, 16]} />
          <meshStandardMaterial color={t.primary} roughness={0.5} />
        </mesh>
        {/* Cap visor / rim - Team Secondary */}
        <mesh position={[0, 0.66, 0.15]} rotation={[-0.25, 0, 0]} castShadow>
          <boxGeometry args={[0.3, 0.05, 0.18]} />
          <meshStandardMaterial color={t.secondary} roughness={0.5} />
        </mesh>
        {/* Cap crown badge button */}
        <mesh position={[0, 0.81, 0]} castShadow>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

