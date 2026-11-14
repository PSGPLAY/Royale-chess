import type { FC } from 'react'
import { Crown, Swords, X } from 'lucide-react'
import { navigationStore } from '../../state/appNavigationStore'

interface PvPModeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Modal to select between Normal Chess and Royale Chess for Person-to-Person Play
 */
export const PvPModeSelectorModal: FC<PvPModeSelectorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="landing-modal-overlay" onClick={onClose}>
      <div className="landing-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-bar">
          <div className="modal-title-group">
            <Swords size={24} className="modal-sword-icon" />
            <h3 className="modal-title">Person to Person Match</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <p className="modal-desc">
          Play locally on this device with a friend. Choose your battle rules:
        </p>

        <div className="pvp-options-grid">
          {/* Option 1: Royale Mode (Kings Only + 4 Coins) */}
          <div
            className="pvp-option-card royale-option"
            onClick={() => {
              onClose()
              navigationStore.launchGame('pvp_royale')
            }}
          >
            <div className="option-badge">RECOMMENDED</div>
            <div className="option-icon-wrapper royale-glow">
              <Crown size={32} />
            </div>
            <h4 className="option-name">Royale Mode</h4>
            <p className="option-summary">
              Start with <strong>only your King and 4 coins</strong>. Recruit sailors, build your fleet, and conquer!
            </p>
            <div className="option-features">
              <span>✓ 4 Starting Coins</span>
              <span>✓ Deployable Units</span>
              <span>✓ Gold Cauldrons</span>
            </div>
            <button className="btn-play-variant royale-btn">Play Royale PvP</button>
          </div>

          {/* Option 2: Normal Chess (Classic 32 Pieces) */}
          <div
            className="pvp-option-card normal-option"
            onClick={() => {
              onClose()
              navigationStore.launchGame('pvp_normal')
            }}
          >
            <div className="option-badge classic-badge">CLASSIC</div>
            <div className="option-icon-wrapper normal-glow">
              <span className="chess-pawn-emoji">♟️</span>
            </div>
            <h4 className="option-name">Normal Chess</h4>
            <p className="option-summary">
              Pure traditional chess rules with standard 32 pieces on the board.
            </p>
            <div className="option-features">
              <span>✓ Standard 32 Pieces</span>
              <span>✓ Official FIDE Rules</span>
              <span>✓ Pure Strategy</span>
            </div>
            <button className="btn-play-variant normal-btn">Play Normal PvP</button>
          </div>
        </div>
      </div>
    </div>
  )
}

