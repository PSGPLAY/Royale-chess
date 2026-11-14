import type { FC } from 'react'
import type { PieceProps } from './types'
import { BasePedestal } from './BasePedestal'
import { TEAM_COLORS } from './types'

/**
 * 3D Bishop: The Ship's Navigator / Quartermaster
 * Master of the seas with flowing robes, traditional slotted miter hat, brass telescope, and astrolabe.
 */
export const BishopPiece: FC<PieceProps> = ({ color, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Base Pedestal */}
      <BasePedestal color={color} />

      {/* 2. Navigator Body & Robe (sits on pedestal at y = 0.41) */}
      <group position={[0, 0.41, 0]}>
        {/* Robe lower taper */}
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.28, 0.38, 0.32, 16]} />
          <meshStandardMaterial color={t.primary} roughness={0.65} />
        </mesh>

        {/* Golden rope cincture belt */}
        <mesh position={[0, 0.32, 0]} castShadow>
          <torusGeometry args={[0.285, 0.025, 10, 20]} />
          <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Robe torso & cowl mantle */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.28, 0.3, 16]} />
          <meshStandardMaterial color={t.secondary} roughness={0.6} />
        </mesh>

        {/* Golden Astrolabe / Compass Medal on chest */}
        <mesh position={[0, 0.48, 0.23]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.03, 16]} />
          <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.48, 0.25]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.02, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>

        {/* Brass Spyglass / Telescope held under left arm */}
        <group position={[-0.26, 0.4, 0.08]} rotation={[0.4, 0.2, -0.3]}>
          {/* Main brass tube */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.45, 10]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Eyepiece */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.048, 0.05, 10]} />
            <meshStandardMaterial color="#92400e" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Objective lens */}
          <mesh position={[0, -0.23, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.06, 10]} />
            <meshStandardMaterial color="#92400e" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Head */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={t.skin} roughness={0.6} />
        </mesh>

        {/* 3. The Bishop's Slotted Miter Hat */}
        <group position={[0, 0.9, 0]}>
          {/* Main elongated egg/miter shape */}
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={t.primary} roughness={0.55} />
          </mesh>
          {/* Upper pointed cone tip */}
          <mesh position={[0, 0.24, 0]} castShadow>
            <coneGeometry args={[0.16, 0.22, 16]} />
            <meshStandardMaterial color={t.primary} roughness={0.55} />
          </mesh>

          {/* The signature Bishop's cross slit/notch at the apex */}
          <mesh position={[0, 0.26, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.04, 0.16, 0.26]} />
            <meshStandardMaterial color={t.accent} metalness={0.8} roughness={0.3} />
          </mesh>

          {/* Golden spherical pommel finial */}
          <mesh position={[0, 0.36, 0]} castShadow>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
