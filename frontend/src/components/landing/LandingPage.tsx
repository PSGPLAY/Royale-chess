import type { FC } from 'react'
import { useState } from 'react'
import { Crown, Swords, Shield, Eye, Lock, ArrowRight, Sparkles, User, Trophy, Coins, Globe, Compass } from 'lucide-react'
import { GAME_MODES } from '../../state/gameModeConfig'
import type { GameModeId } from '../../state/gameModeConfig'
import { navigationStore } from '../../state/appNavigationStore'
import { useAuthStore, authStore } from '../../state/authStore'
import { PvPModeSelectorModal } from './PvPModeSelectorModal'
import { OnlineModeSelectorModal } from '../multiplayer/OnlineModeSelectorModal'
import { audioEngine } from '../../audio/audioEngine'
import { getGuestDisplayName } from '../../utils/guestSession'

export const LandingPage: FC = () => {
  const [isPvPModalOpen, setIsPvPModalOpen] = useState(false)
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()

  const handleModeClick = (modeId: GameModeId) => {
    audioEngine.playButtonClick()
    if (modeId === 'blind') return

    if (modeId === 'pvp_normal' || modeId === 'pvp_royale') {
      setIsPvPModalOpen(true)
      return
    }

    navigationStore.launchGame(modeId)
  }

  const handleStartOnline = () => {
    audioEngine.playButtonClick()
    setIsOnlineModalOpen(true)
  }

  return (
    <div className="landing-container">
      {/* 1. Chess.com-Style Top Header Bar */}
      <header className="landing-header">
        <div className="landing-brand">
          <div className="brand-logo-icon">
            <Crown size={22} className="crown-icon" />
          </div>
          <div className="brand-text-group">
            <h1 className="brand-title">ROYAL CHESS</h1>
            <span className="brand-tag">STRATEGY & CLASSIC</span>
          </div>
        </div>

        <nav className="landing-nav">
          <button className="nav-item nav-item-play active">Play</button>
          <button className="nav-item nav-item-pvp" onClick={() => setIsPvPModalOpen(true)}>
            Pass & Play
          </button>
          <button
            className="nav-item nav-item-settings"
            onClick={() => {
              audioEngine.playButtonClick()
              navigationStore.openSettingsPage()
            }}
          >
            Settings
          </button>

          {/* Profile / Auth Pill */}
          {isAuthenticated && user ? (
            <div
              className="nav-profile-pill"
              onClick={() => navigationStore.openProfilePage('overview', user.username)}
              title="View your profile and rankings"
            >
              <div className="nav-avatar">
                {user.avatar && (user.avatar.startsWith('data:') || user.avatar.startsWith('/') || user.avatar.startsWith('http')) ? (
                  <img src={user.avatar} alt="Avatar" className="nav-avatar-img" />
                ) : (
                  '👤'
                )}
              </div>
              <div className="nav-user-info">
                <span className="nav-nickname">{user.nickname || user.username}</span>
                <div className="nav-stats-row">
                  <span className="nav-elo">
                    <Trophy size={11} /> {user.rating_elo}
                  </span>
                  <span className="nav-coins">
                    <Coins size={11} /> {user.persistent_coins}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-guest-group">
              <div
                className="nav-guest-pill"
                onClick={() => navigationStore.openProfilePage()}
                title="View Guest Session & Rankings"
              >
                <span className="guest-badge-dot" />
                <span>{getGuestDisplayName()}</span>
              </div>
              <button
                className="btn-nav-auth"
                onClick={() => authStore.openAuthModal()}
              >
                <User size={14} />
                <span>Log In</span>
              </button>
            </div>
          )}

          <div className="platform-pill desktop-only-pill">
            <span>Web & Mobile</span>
          </div>
        </nav>
      </header>

      {/* 2. Main Hero & Game Mode Grid */}
      <main className="landing-main">
        {/* Left Column: Hero Spotlight */}
        <section className="hero-spotlight">
          <div className="hero-content">
            <div className="hero-kicker">
              <Sparkles size={16} className="kicker-icon" />
              <span>THE NEXT EVOLUTION OF CHESS</span>
            </div>

            <h2 className="hero-headline">
              Play Chess. <br />
              <span className="gradient-text">Play Your Next Game.</span>
            </h2>

            <p className="hero-description">
              Experience traditional chess or step into <strong>Royale Mode</strong>: start with
              only your King and 4 coins, earn bounties on every move, and recruit your army in battle.
            </p>

            <div className="hero-cta-group">
              <button
                className="btn-hero-primary"
                onClick={handleStartOnline}
              >
                <Globe size={20} />
                <span>Find Online Match</span>
                <ArrowRight size={18} className="arrow-icon" />
              </button>

              <button
                className="btn-hero-secondary"
                onClick={() => setIsPvPModalOpen(true)}
              >
                <Swords size={18} />
                <span>Pass & Play (Local)</span>
              </button>
            </div>

            {/* Quick Feature Pillars */}
            <div className="feature-pillars">
              <div className="pillar-item">
                <span className="pillar-icon">👑</span>
                <div className="pillar-text">
                  <strong>Royale Rules</strong>
                  <small>King + 4 Coins Start</small>
                </div>
              </div>

              <div className="pillar-item">
                <span className="pillar-icon">💰</span>
                <div className="pillar-text">
                  <strong>Move & Earn</strong>
                  <small>+1 Coin Every Turn</small>
                </div>
              </div>

              <div className="pillar-item">
                <span className="pillar-icon">🌐</span>
                <div className="pillar-text">
                  <strong>Multiplayer</strong>
                  <small>Instant Matchmaking</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Game Modes Selection Grid */}
        <section className="modes-section">
          <div className="modes-header">
            <h3 className="section-title">Select Game Mode</h3>
            <span className="section-sub">Choose a game mode:</span>
          </div>

          <div className="modes-grid">
            {/* 1. Quick Online Matchmaking (Featured Card) */}
            <div
              className="mode-card featured-online"
              onClick={handleStartOnline}
            >
              <div className="card-top">
                <div className="mode-badge online-badge">MULTIPLAYER</div>
                <div className="mode-icon-circle online-icon">
                  <Compass size={24} />
                </div>
              </div>
              <h4 className="mode-title">Play Online</h4>
              <span className="mode-variant-label">Instant Matchmaking</span>
              <p className="mode-desc">
                Find another player on the high seas! Connects you automatically to an opponent for a real-time battle.
              </p>
              <div className="mode-card-footer">
                <span className="action-link">Search Opponent ›</span>
              </div>
            </div>

            {/* 2. Player to Player Local Pass & Play */}
            <div
              className="mode-card featured-pvp"
              onClick={() => setIsPvPModalOpen(true)}
            >
              <div className="card-top">
                <div className="mode-badge pvp-badge">PASS & PLAY</div>
                <div className="mode-icon-circle pvp-icon">
                  <Swords size={24} />
                </div>
              </div>
              <h4 className="mode-title">Player vs Player</h4>
              <span className="mode-variant-label">Local Person-to-Person</span>
              <p className="mode-desc">
                Play on the same screen with a friend. Choose between <strong>Normal Chess</strong> (32 pieces) or <strong>Royale Chess</strong> (King + 4 coins).
              </p>
              <div className="mode-card-footer">
                <span className="action-link">Select Mode & Play ›</span>
              </div>
            </div>

            {/* Other Modes from Config */}
            {GAME_MODES.filter(
              (m) => m.id !== 'pvp_normal' && m.id !== 'pvp_royale'
            ).map((mode) => {
              const isBlind = mode.id === 'blind'

              return (
                <div
                  key={mode.id}
                  className={`mode-card ${isBlind ? 'disabled-card' : ''} ${
                    mode.isRoyaleRules ? 'royale-card' : ''
                  }`}
                  onClick={() => handleModeClick(mode.id)}
                >
                  <div className="card-top">
                    {mode.badge && (
                      <div
                        className={`mode-badge ${
                          isBlind
                            ? 'locked-badge'
                            : mode.isRoyaleRules
                            ? 'royale-badge'
                            : ''
                        }`}
                      >
                        {isBlind && <Lock size={10} />}
                        <span>{mode.badge}</span>
                      </div>
                    )}
                    <div className="mode-icon-circle">
                      {mode.id === 'blind' ? (
                        <Eye size={22} />
                      ) : mode.isRoyaleRules ? (
                        <Crown size={22} />
                      ) : (
                        <Shield size={22} />
                      )}
                    </div>
                  </div>

                  <h4 className="mode-title">{mode.title}</h4>
                  <span className="mode-variant-label">{mode.subtitle}</span>
                  <p className="mode-desc">{mode.description}</p>

                  <div className="mode-card-footer">
                    {isBlind ? (
                      <span className="coming-soon-tag">Coming in Future Update</span>
                    ) : (
                      <span className="action-link">Start Match ›</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>

      {/* 3. Person to Person Modal */}
      <PvPModeSelectorModal
        isOpen={isPvPModalOpen}
        onClose={() => setIsPvPModalOpen(false)}
      />

      {/* 4. Online Multiplayer Mode Selector Modal */}
      <OnlineModeSelectorModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
      />
    </div>
  )
}
