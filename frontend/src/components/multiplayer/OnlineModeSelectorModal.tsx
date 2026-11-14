import type { FC } from 'react'
import { Globe, X } from 'lucide-react'
import { multiplayerStore } from '../../state/multiplayerStore'
import { audioEngine } from '../../audio/audioEngine'

interface OnlineModeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

interface OnlineModeOption {
  id: string
  title: string
  variant: string
  badge: string
  badgeType: 'ranked' | 'casual'
  icon: string
  description: string
  features: string[]
}

const ONLINE_MODES: OnlineModeOption[] = [
  {
    id: 'ranked_royale',
    title: 'Royale Strategy',
    variant: 'Competitive Ranked',
    badge: '🏆 RANKED ELO',
    badgeType: 'ranked',
    icon: '👑',
    description: 'Start with only King and 4 coins. Earn coins every move, deploy troops, and climb global ranks.',
    features: ['Official ELO Stakes', 'King + 4 Coins', 'Unit Deployment Shop'],
  },
  {
    id: 'unranked_royale',
    title: 'Royale Casual',
    variant: 'Unranked Practice',
    badge: '🛡️ CASUAL',
    badgeType: 'casual',
    icon: '⚔️',
    description: 'Experience full Royale Mode mechanics with zero rating pressure. Ideal for experimenting with fleet builds.',
    features: ['No Rating Risk', 'Full Economy & Shop', 'Casual Practice'],
  },
  {
    id: 'ranked_normal',
    title: 'Classic Chess',
    variant: 'Competitive Ranked',
    badge: '🏆 RANKED ELO',
    badgeType: 'ranked',
    icon: '♟️',
    description: 'Standard 32-piece FIDE chess. True master strategy with official ELO rating gains and losses.',
    features: ['Official ELO Stakes', 'Standard 32 Pieces', 'FIDE Chess Rules'],
  },
  {
    id: 'unranked_normal',
    title: 'Classic Casual',
    variant: 'Unranked Friendly',
    badge: '♟️ CASUAL',
    badgeType: 'casual',
    icon: '☕',
    description: 'Traditional 32-piece chess battle with no rating stakes. Relaxed, pure, classic board game.',
    features: ['No Rating Risk', 'Standard 32 Pieces', 'Relaxed Match'],
  },
]

export const OnlineModeSelectorModal: FC<OnlineModeSelectorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const handleSelectMode = (modeId: string) => {
    audioEngine.playButtonClick()
    onClose()
    multiplayerStore.startMatchmaking(modeId)
  }

  return (
    <div className="landing-modal-overlay" onClick={onClose}>
      <div className="landing-modal-card online-selector-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="modal-top-bar">
          <div className="modal-title-group">
            <Globe size={24} className="modal-globe-icon" />
            <h3 className="modal-title">Select Online Multiplayer Mode</h3>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <p className="modal-desc">
          Choose which variant and competitive tier you want to search an opponent for:
        </p>

        {/* 4-Mode Cards Grid */}
        <div className="online-modes-grid">
          {ONLINE_MODES.map((mode) => {
            const isRanked = mode.badgeType === 'ranked'

            return (
              <div
                key={mode.id}
                className={`online-option-card ${isRanked ? 'ranked-card' : 'casual-card'}`}
                onClick={() => handleSelectMode(mode.id)}
              >
                <div className="card-header-row">
                  <span className={`mode-pill-badge ${isRanked ? 'pill-ranked' : 'pill-casual'}`}>
                    {mode.badge}
                  </span>
                  <div className="mode-emoji-icon">{mode.icon}</div>
                </div>

                <div className="card-body">
                  <h4 className="mode-card-title">{mode.title}</h4>
                  <span className="mode-card-subtitle">{mode.variant}</span>
                  <p className="mode-card-desc">{mode.description}</p>
                </div>

                <div className="mode-features-list">
                  {mode.features.map((feat, idx) => (
                    <span key={idx} className="feature-bullet">
                      ✓ {feat}
                    </span>
                  ))}
                </div>

                <button className={`btn-launch-search ${isRanked ? 'btn-ranked-search' : 'btn-casual-search'}`}>
                  <span>Find {mode.title} Match ›</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

