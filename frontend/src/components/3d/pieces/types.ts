import type { PieceColor, PieceType } from '../../../types/chess'

export interface PieceProps {
  color: PieceColor // 'w' (Blue team) or 'b' (Red team)
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  isSelected?: boolean
  isHovered?: boolean
  onClick?: (e: { stopPropagation: () => void }) => void
  onPointerOver?: (e: { stopPropagation: () => void }) => void
  onPointerOut?: () => void
}

export interface UnifiedPieceProps extends PieceProps {
  type: PieceType
}

/**
 * Team colors matching the reference screenshot:
 * White faction = Pure Royal Blue Pirate Crew
 * Black faction = Pure Crimson Red Pirate Crew
 */
export const TEAM_COLORS = {
  w: {
    primary: '#1d63ea', // Vibrant Royal Blue
    secondary: '#134099', // Deep Rich Navy Blue
    accent: '#f59e0b', // Gleaming Gold
    trim: '#60a5fa', // Bright sky blue highlight
    leather: '#1e293b', // Dark slate leather
    fabric: '#eff6ff', // Clean white-blue fabric
    metal: '#e2e8f0', // Polished silver/steel
    skin: '#fed7aa', // Warm stylized skin tone
  },
  b: {
    primary: '#dc2626', // Vibrant Crimson Red
    secondary: '#881337', // Deep Rich Burgundy Red
    accent: '#f59e0b', // Gleaming Gold
    trim: '#f87171', // Bright rose-red highlight
    leather: '#1f1315', // Dark deep burgundy leather
    fabric: '#fff1f2', // Clean off-white fabric
    metal: '#cbd5e1', // Polished silver/steel
    skin: '#fed7aa', // Warm stylized skin tone
  },
}
