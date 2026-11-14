import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D King: The Pirate Captain
 * Fully team-colored Captain (Pure Royal Blue or Crimson Red bicorne hat & longcoat)
 * with White Skull & Crossbones, high collar, epaulettes, and gold sash.
 */
export const KingPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Captain Body & Coat (sits atop pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Lower coat skirt */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.4, 0.24, 16]} />
          <meshStandardMaterial color={t.primary} roughness={0.6} />
        </mesh>

        {/* Commander's Gold Sash & Leather Belt */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <cylinderGeometry args={[0.34, 0.35, 0.09, 16]} />
          <meshStandardMaterial color={t.leather} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.26, 0.33]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.05]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Diagonal sash across chest */}
        <mesh position={[0, 0.38, 0.28]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[0.12, 0.3, 0.06]} />
          <meshStandardMaterial color={t.accent} metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Torso / Double-Breasted Longcoat */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.34, 0.35, 16]} />
          <meshStandardMaterial color={t.primary} roughness={0.6} />
        </mesh>

        {/* Golden coat buttons */}
        {[-0.08, 0.08].map((bx, i) => (
          <group key={`btn-col-${i}`}>
            {[0.36, 0.46, 0.56].map((by, j) => (
              <mesh key={`btn-${i}-${j}`} position={[bx, by, 0.29]} castShadow>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}

        {/* High upturned pirate coat collar */}
        <mesh position={[0, 0.65, -0.05]} rotation={[-0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.18, 0.12]} />
          <meshStandardMaterial color={t.secondary} roughness={0.6} />
        </mesh>

        {/* Ornate Gold Epaulettes on shoulders */}
        <mesh position={[-0.34, 0.58, 0]} rotation={[0, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 12]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.34, 0.58, 0]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 12]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Head & Beard */}
        <mesh position={[0, 0.74, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={t.skin} roughness={0.6} />
        </mesh>
        {/* Captain's beard */}
        <mesh position={[0, 0.68, 0.16]} castShadow>
          <boxGeometry args={[0.22, 0.16, 0.14]} />
          <meshStandardMaterial color={t.leather} roughness={0.9} />
        </mesh>

        {/* 3. The Signature Captain's Bicorne Hat - Boldly Team Colored */}
        <group position={[0, 0.94, 0]}>
          {/* Main swept curved bicorne wings (Vibrant Blue or Crimson Red) */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.92, 0.32, 0.28]} />
            <meshStandardMaterial color={t.primary} roughness={0.5} />
          </mesh>
          {/* Left swept wing tip - Team Secondary */}
          <mesh position={[-0.44, 0.1, 0]} rotation={[0, 0, 0.4]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 0.2, 12]} />
            <meshStandardMaterial color={t.secondary} roughness={0.5} />
          </mesh>
          {/* Right swept wing tip - Team Secondary */}
          <mesh position={[0.44, 0.1, 0]} rotation={[0, 0, -0.4]} castShadow>
            <cylinderGeometry args={[0.08, 0.14, 0.2, 12]} />
            <meshStandardMaterial color={t.secondary} roughness={0.5} />
          </mesh>
          {/* Gold braided trim along top curve */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.94, 0.04, 0.3]} />
            <meshStandardMaterial color={t.accent} metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Golden Skull & Crossbones Front Crest (King's royal pirate emblem) */}
          <group position={[0, 0, 0.16]}>
            {/* Skull */}
            <mesh position={[0, 0.04, 0]} castShadow>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            {/* Jaw */}
            <mesh position={[0, -0.03, 0]} castShadow>
              <boxGeometry args={[0.06, 0.05, 0.04]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            {/* Crossbones */}
            <mesh rotation={[0, 0, Math.PI / 4]} position={[0, 0, -0.01]}>
              <boxGeometry args={[0.2, 0.03, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]} position={[0, 0, -0.01]}>
              <boxGeometry args={[0.2, 0.03, 0.02]} />
              <meshStandardMaterial color="#ffffff" roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
