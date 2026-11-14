import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X, Trophy, Coins, Swords, Shield, LogOut, Award, UserPlus, Crown, Medal } from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { api } from '../../api/client'
import type { UserProfileData } from '../../api/client'
import { audioEngine } from '../../audio/audioEngine'
import { getGuestDisplayName, getOrCreateGuestSessionId } from '../../utils/guestSession'

export const ProfileModal: FC = () => {
  const { isProfileModalOpen, user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard'>('profile')
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

  // Fetch leaderboard when switching to leaderboard tab or on open
  useEffect(() => {
    if (isProfileModalOpen && activeTab === 'leaderboard') {
      setLoadingLeaderboard(true)
      api.getLeaderboard(25)
        .then((data) => setLeaderboard(data))
        .catch(() => setLeaderboard([]))
        .finally(() => setLoadingLeaderboard(false))
    }
  }, [isProfileModalOpen, activeTab])

  if (!isProfileModalOpen) return null

  const handleLogout = async () => {
    audioEngine.playButtonClick()
    await authStore.logout()
  }

  const guestName = getGuestDisplayName()
  const guestSession = getOrCreateGuestSessionId()

  const displayName = user ? (user.nickname || user.username) : guestName
  const displayUsername = user ? `@${user.username}` : `Session ID: #${guestSession}`
  const displayElo = user ? user.rating_elo : 1200
  const globalRankText = user?.global_rank ? `#${user.global_rank}` : 'Unranked Guest'

  return (
    <div className="auth-modal-overlay" onClick={() => authStore.closeProfileModal()}>
      <div className="profile-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="profile-close-btn"
          onClick={() => authStore.closeProfileModal()}
          title="Close Profile"
        >
          <X size={18} />
        </button>

        {/* Tab Switcher: Profile vs Rankings */}
        <div className="profile-tabs-header">
          <button
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              audioEngine.playButtonClick()
              setActiveTab('profile')
            }}
          >
            <Award size={15} />
            <span>Commander Dossier</span>
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => {
              audioEngine.playButtonClick()
              setActiveTab('leaderboard')
            }}
          >
            <Trophy size={15} />
            <span>High Seas Rankings</span>
          </button>
        </div>

        {activeTab === 'profile' ? (
          <>
            {/* Profile Avatar & Hero Banner */}
            <div className="profile-hero">
              <div className="profile-avatar-wrapper">
                <span className="profile-avatar-emoji">{user ? '🏴‍☠️' : '⚓'}</span>
                <div className="profile-rank-badge">
                  <Crown size={12} />
                </div>
              </div>
              <h3 className="profile-nickname">{displayName}</h3>
              <span className="profile-username">{displayUsername}</span>

              <div className="profile-pills-row">
                <div className="profile-rating-pill">
                  <Trophy size={14} className="trophy-gold" />
                  <span className="elo-value">{displayElo} ELO</span>
                </div>
                <div className="profile-global-rank-pill">
                  <Medal size={14} className="rank-medal" />
                  <span>Rank {globalRankText}</span>
                </div>
              </div>
            </div>

            {/* Account Currencies & Stats Grid */}
            <div className="profile-stats-grid">
              <div className="stat-card stat-coins">
                <Coins size={18} className="stat-icon-coin" />
                <div className="stat-text">
                  <span className="stat-num">{user ? user.persistent_coins : 100}</span>
                  <span className="stat-label">Treasury Gold</span>
                </div>
              </div>

              <div className="stat-card">
                <Swords size={18} className="stat-icon-matches" />
                <div className="stat-text">
                  <span className="stat-num">{user ? user.total_matches : 0}</span>
                  <span className="stat-label">Total Battles</span>
                </div>
              </div>

              <div className="stat-card">
                <Shield size={18} className="stat-icon-winrate" />
                <div className="stat-text">
                  <span className="stat-num">{user ? `${user.win_rate}%` : '0%'}</span>
                  <span className="stat-label">Win Rate</span>
                </div>
              </div>

              <div className="stat-card">
                <Trophy size={18} className="stat-icon-wins" />
                <div className="stat-text">
                  <span className="stat-num">
                    {user ? `${user.wins}W / ${user.losses}L` : '0W / 0L'}
                  </span>
                  <span className="stat-label">Battle Record</span>
                </div>
              </div>
            </div>

            {/* Guest Notice or Logged-in Actions */}
            {!isAuthenticated ? (
              <div className="guest-profile-prompt">
                <p className="guest-prompt-text">
                  Playing as a guest! Create an account to permanently save your ELO rating, treasury gold, and battle history.
                </p>
                <button
                  className="btn-profile-enlist"
                  onClick={() => {
                    authStore.closeProfileModal()
                    authStore.openAuthModal()
                  }}
                >
                  <UserPlus size={16} />
                  <span>Enlist as Permanent Commander</span>
                </button>
              </div>
            ) : (
              <div className="profile-footer">
                <button className="btn-profile-logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Abandon Fleet (Log Out)</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* High Seas Leaderboard Tab */
          <div className="profile-leaderboard-container">
            <div className="leaderboard-table-header">
              <span className="col-rank">#</span>
              <span className="col-name">Commander</span>
              <span className="col-elo">ELO Rating</span>
              <span className="col-record">W / L</span>
              <span className="col-winrate">Win Rate</span>
            </div>

            <div className="leaderboard-list">
              {loadingLeaderboard ? (
                <div className="leaderboard-loading">
                  <span>Charting top fleets...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                  <span>No ranked battles recorded yet. Be the first to claim glory!</span>
                </div>
              ) : (
                leaderboard.map((item, index) => {
                  const rank = index + 1
                  const isCurrentUser = user && user.username === item.username
                  const rankMedalClass = rank === 1 ? 'rank-gold' : rank === 2 ? 'rank-silver' : rank === 3 ? 'rank-bronze' : ''

                  return (
                    <div
                      key={item.id}
                      className={`leaderboard-row ${rankMedalClass} ${isCurrentUser ? 'current-user-row' : ''}`}
                    >
                      <div className="col-rank">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>
                      <div className="col-name">
                        <span className="commander-avatar">🏴‍☠️</span>
                        <span className="commander-name">
                          {item.nickname || item.username}
                          {isCurrentUser && <small className="you-badge">(You)</small>}
                        </span>
                      </div>
                      <div className="col-elo">
                        <Trophy size={12} className="elo-icon" />
                        <span>{item.rating_elo}</span>
                      </div>
                      <div className="col-record">
                        <span>{item.wins}W / {item.losses}L</span>
                      </div>
                      <div className="col-winrate">
                        <span>{item.win_rate}%</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
