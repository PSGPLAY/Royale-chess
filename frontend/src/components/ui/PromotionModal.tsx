import type { FC } from 'react'
import type { PieceType } from '../../types/chess'
import { useGameStore, gameStore } from '../../state/gameStore'

/**
 * Pawn Promotion Modal
 * Prompts the player to choose their promotion unit: Queen, Knight, Rook, or Bishop.
 */
export const PromotionModal: FC = () => {
  const { pendingPromotion, turn } = useGameStore()

  if (!pendingPromotion) return null

  const isWhite = turn === 'w'
  const teamColor = isWhite ? '#1d63ea' : '#dc2626'

  const options: { type: PieceType; label: string; icon: string; desc: string }[] = [
    { type: 'q', label: 'Queen', icon: '👑', desc: 'Sovereign' },
    { type: 'n', label: 'Knight', icon: '🐴', desc: 'Cavalier' },
    { type: 'r', label: 'Rook', icon: '🏰', desc: 'Citadel' },
    { type: 'b', label: 'Bishop', icon: '🔭', desc: 'Navigator' },
  ]

  return (
    <div className="promotion-overlay">
      <div className="promotion-card">
        <h3 className="promotion-title">Pawn Promotion</h3>
        <p className="promotion-subtitle">
          Choose a piece to promote your pawn to:
        </p>

        <div className="promotion-options-grid">
          {options.map((opt) => (
            <button
              key={opt.type}
              className="promotion-option-btn"
              onClick={() => gameStore.confirmPromotion(opt.type)}
              style={{ borderColor: teamColor }}
            >
              <span className="opt-icon">{opt.icon}</span>
              <span className="opt-label">{opt.label}</span>
              <span className="opt-desc">{opt.desc}</span>
            </button>
          ))}
        </div>

        <button
          className="btn-cancel-promotion"
          onClick={() => gameStore.cancelPromotion()}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

