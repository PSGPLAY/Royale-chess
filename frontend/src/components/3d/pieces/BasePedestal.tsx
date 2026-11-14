import type { FC } from 'react'
import type { PieceColor } from '../../../types/chess'
import { TEAM_COLORS } from './types'

interface BasePedestalProps {
  color: PieceColor
}

/**
 * Stout circular carved wooden pedestal base seen under all pieces in the reference image.
 * Strongly tinted with team identity (Pure Blue for White, Pure Red for Black)
 * with carved wooden core and gold accents.
 */
export const BasePedestal: FC<BasePedestalProps> = ({ color }) => {
  const t = TEAM_COLORS[color]

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Bottom beveled flange - Team Secondary */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.48, 0.52, 0.1, 24]} />
        <meshStandardMaterial color={t.secondary} roughness={0.7} />
      </mesh>

      {/* 2. Middle carved wooden trunk */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.44, 0.46, 0.2, 24]} />
        <meshStandardMaterial color="#382114" roughness={0.8} />
      </mesh>

      {/* 3. Team-colored metallic or carved accent ring */}
      <mesh position={[0, 0.31, 0]} castShadow>
        <torusGeometry args={[0.445, 0.025, 12, 24]} />
        <meshStandardMaterial color={t.accent} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 4. Top beveled mounting disc - Team Primary */}
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.46, 0.44, 0.1, 24]} />
        <meshStandardMaterial color={t.primary} roughness={0.6} />
      </mesh>
    </group>
  )
}
