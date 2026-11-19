import type { FC } from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Trophy, Coins, Swords, Shield, LogOut, Crown, Medal,
  TrendingUp, Calendar, Target, Zap, Star,
  ChevronRight, RotateCcw, Globe, User, Award,
} from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { navigationStore, useNavigationStore } from '../../state/appNavigationStore'
import { api } from '../../api/client'
import type { UserProfileData, MatchData } from '../../api/client'
import { audioEngine } from '../../audio/audioEngine'
import { getGuestDisplayName, getOrCreateGuestSessionId } from '../../utils/guestSession'

// ─── Helpers ────────────────────────────────────────────────────────────────

const RANK_TIERS = [
  { label: 'Grand Admiral', min: 2000, icon: '🌟', color: '#ffd700' },
  { label: 'Admiral',       min: 1800, icon: '⚓', color: '#c0c0ff' },
  { label: 'Commodore',     min: 1600, icon: '🏴‍☠️', color: '#a8d8ea' },
  { label: 'Captain',       min: 1400, icon: '⚔️',  color: '#c8e6c9' },
  { label: 'First Mate',    min: 1200, icon: '🗺️',  color: '#ffe0b2' },
  { label: 'Sailor',        min: 0,    icon: '🪝',  color: '#bcaaa4' },
]

function getTier(elo: number) {
  return RANK_TIERS.find((t) => elo >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1]
}

function getNextTier(elo: number) {
  const idx = RANK_TIERS.findIndex((t) => elo >= t.min)
  return idx > 0 ? RANK_TIERS[idx - 1] : null
}

function getEloProgress(elo: number) {
  const tier = getTier(elo)
  const next = getNextTier(elo)
  if (!next) return 100
  const tierMin = tier.min
  const nextMin = next.min
  return Math.round(((elo - tierMin) / (nextMin - tierMin)) * 100)
}

const MODE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  ranked_royale:   { label: 'Royale Ranked',  icon: '👑', color: '#f59e0b' },
  royale:          { label: 'Royale Ranked',  icon: '👑', color: '#f59e0b' },
  unranked_royale: { label: 'Royale Casual',  icon: '⚔️',  color: '#a78bfa' },
  ranked_normal:   { label: 'Classic Ranked', icon: '♟️',  color: '#60a5fa' },
  normal:          { label: 'Classic Casual', icon: '☕',  color: '#6b7280' },
  unranked_normal: { label: 'Classic Casual', icon: '☕',  color: '#6b7280' },
  pvp_royale:      { label: 'Local Royale',   icon: '🏠',  color: '#34d399' },
  pvp_normal:      { label: 'Local Chess',    icon: '🏠',  color: '#34d399' },
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ─── Component ──────────────────────────────────────────────────────────────

type TabId = 'overview' | 'history' | 'leaderboard'

export const ProfilePage: FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { currentScreen, profileTab } = useNavigationStore()
  const [activeTab, setActiveTab] = useState<TabId>(profileTab)
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([])
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(
    profileTab === 'leaderboard' || (profileTab === 'history' && isAuthenticated),
  )

  const guestName = getGuestDisplayName()
  const guestSession = getOrCreateGuestSessionId()

  const displayName  = user ? (user.nickname || user.username) : guestName
  const displayAt    = user ? `@${user.username}` : `#${guestSession.slice(0, 8)}`
  const elo          = user?.rating_elo ?? 1200
  const tier         = getTier(elo)
  const nextTier     = getNextTier(elo)
  const eloProgress  = getEloProgress(elo)

  const wins   = user?.wins         ?? 0
  const losses = user?.losses       ?? 0
  const draws  = user?.draws        ?? 0
  const total  = user?.total_matches ?? 0
  const wr     = user?.win_rate      ?? 0
  const coins  = user?.persistent_coins ?? 0
  const rank   = user?.global_rank ? `#${user.global_rank}` : '—'
  const joinedAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'

  const fetchLeaderboard = useCallback(() => {
    setLoading(true)
    api.getLeaderboard(50)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false))
  }, [])

  const fetchHistory = useCallback(() => {
    if (!isAuthenticated) return
    setLoading(true)
    api.getMatchHistory()
      .then((data) => setMatchHistory(data.filter((m) => m.status === 'completed').slice(0, 20)))
      .catch(() => setMatchHistory([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  useEffect(() => {
    if (currentScreen !== 'profile') return
    let isCurrentView = true

    if (activeTab === 'leaderboard') {
      api.getLeaderboard(50)
        .then((data) => { if (isCurrentView) setLeaderboard(data) })
        .catch(() => { if (isCurrentView) setLeaderboard([]) })
        .finally(() => { if (isCurrentView) setLoading(false) })
    } else if (activeTab === 'history' && isAuthenticated) {
      api.getMatchHistory()
        .then((data) => {
          if (isCurrentView) setMatchHistory(data.filter((match) => match.status === 'completed').slice(0, 20))
        })
        .catch(() => { if (isCurrentView) setMatchHistory([]) })
        .finally(() => { if (isCurrentView) setLoading(false) })
    }

    return () => { isCurrentView = false }
  }, [currentScreen, activeTab, isAuthenticated])

  if (currentScreen !== 'profile') return null

  const handleLogout = async () => {
    audioEngine.playButtonClick()
    await authStore.logout()
  }

  const getMatchResult = (match: MatchData): 'win' | 'loss' | 'draw' | 'unknown' => {
    if (!user || !match.winner) return 'unknown'
    if (match.winner === 'draw') return 'draw'
    const iAmWhite = match.white_player === user.id
    if ((iAmWhite && match.winner === 'w') || (!iAmWhite && match.winner === 'b')) return 'win'
    return 'loss'
  }

  const getOpponentName = (match: MatchData): string => {
    if (!user) return 'Opponent'
    const iAmWhite = match.white_player === user.id
    if (iAmWhite) return match.black_username || match.black_guest_name || 'Red Commander'
    return match.white_username || match.white_guest_name || 'Blue Commander'
  }

  return (
    <div className="profile-page-screen">
      <div className="profile-page-panel">

        {/* ── Close ─────────────────────────────────────────────────── */}
        <button className="ppage-close-btn" onClick={() => navigationStore.returnToLanding()} aria-label="Back to lobby">
          <ArrowLeft size={18} />
          <span>Back to Lobby</span>
        </button>

        {/* ══════════════════════════════════════════════════════════════
            LEFT SIDEBAR
        ══════════════════════════════════════════════════════════════ */}
        <aside className="ppage-sidebar">

          {/* Avatar + name */}
          <div className="ppage-avatar-block">
            <div className="ppage-avatar" style={{ borderColor: tier.color }}>
              <span className="ppage-avatar-emoji">{tier.icon}</span>
              <div className="ppage-avatar-status" />
            </div>
            <div className="ppage-identity">
              <h2 className="ppage-display-name">{displayName}</h2>
              <span className="ppage-at-name">{displayAt}</span>
            </div>
          </div>

          {/* Rank tier badge */}
          <div className="ppage-tier-badge" style={{ '--tier-color': tier.color } as React.CSSProperties}>
            <span className="tier-icon">{tier.icon}</span>
            <div className="tier-text">
              <span className="tier-label">{tier.label}</span>
              <span className="tier-elo">{elo.toLocaleString()} ELO</span>
            </div>
          </div>

          {/* ELO progress bar */}
          <div className="ppage-elo-progress">
            <div className="elo-bar-label">
              <span>Progress to {nextTier ? nextTier.label : 'Max Rank'}</span>
              <span>{nextTier ? `${nextTier.min - elo} ELO away` : 'MAX'}</span>
            </div>
            <div className="elo-bar-track">
              <div
                className="elo-bar-fill"
                style={{ width: `${eloProgress}%`, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})` }}
              />
            </div>
          </div>

          {/* Quick stats */}
          <div className="ppage-quick-stats">
            <div className="pqs-item">
              <Crown size={14} />
              <span className="pqs-label">Global Rank</span>
              <span className="pqs-val">{rank}</span>
            </div>
            <div className="pqs-item">
              <Coins size={14} />
              <span className="pqs-label">Treasury</span>
              <span className="pqs-val pqs-gold">{coins.toLocaleString()}</span>
            </div>
            <div className="pqs-item">
              <Calendar size={14} />
              <span className="pqs-label">Member Since</span>
              <span className="pqs-val">{joinedAt}</span>
            </div>
            <div className="pqs-item">
              <Target size={14} />
              <span className="pqs-label">Win Rate</span>
              <span className={`pqs-val ${wr >= 50 ? 'pqs-green' : 'pqs-red'}`}>{wr}%</span>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="ppage-sidenav">
            {([
              { id: 'overview',    label: 'Commander Overview', icon: <User size={15} /> },
              { id: 'history',     label: 'Battle History',     icon: <Swords size={15} /> },
              { id: 'leaderboard', label: 'Rankings',           icon: <Trophy size={15} /> },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                className={`ppage-sidenav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  audioEngine.playButtonClick()
                  setLoading(tab.id === 'leaderboard' || (tab.id === 'history' && isAuthenticated))
                  setActiveTab(tab.id)
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <ChevronRight size={13} className="sidenav-arrow" />
              </button>
            ))}
          </nav>

          {/* Footer actions */}
          <div className="ppage-sidebar-footer">
            {!isAuthenticated ? (
              <button
                className="btn-ppage-enlist"
                onClick={() => { navigationStore.returnToLanding(); authStore.openAuthModal() }}
              >
                <User size={16} />
                <span>Create Account</span>
              </button>
            ) : (
              <button className="btn-ppage-logout" onClick={handleLogout}>
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </aside>

        {/* ══════════════════════════════════════════════════════════════
            MAIN CONTENT AREA
        ══════════════════════════════════════════════════════════════ */}
        <main className="ppage-main">

          {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="ppage-overview">

              {/* Page heading */}
              <div className="ppage-section-heading">
                <Award size={18} className="heading-icon" />
                <h3>Commander Dossier</h3>
              </div>

              {/* Battle record mega-row */}
              <div className="ppage-battle-record-row">
                <div className="battle-record-card wins-card">
                  <span className="brc-num">{wins}</span>
                  <span className="brc-label">Victories</span>
                  <div className="brc-bar wins-bar" style={{ width: `${wr}%` }} />
                </div>
                <div className="battle-record-card draw-card">
                  <span className="brc-num">{draws}</span>
                  <span className="brc-label">Draws</span>
                  <div className="brc-bar draw-bar" style={{ width: `${total > 0 ? (draws / total) * 100 : 0}%` }} />
                </div>
                <div className="battle-record-card loss-card">
                  <span className="brc-num">{losses}</span>
                  <span className="brc-label">Defeats</span>
                  <div className="brc-bar loss-bar" style={{ width: `${total > 0 ? (losses / total) * 100 : 0}%` }} />
                </div>
                <div className="battle-record-card total-card">
                  <span className="brc-num">{total}</span>
                  <span className="brc-label">Total Battles</span>
                </div>
              </div>

              {/* Win-rate visual bar */}
              {total > 0 && (
                <div className="ppage-wr-breakdown">
                  <div className="wrb-bar">
                    <div className="wrb-segment wrb-wins"  style={{ width: `${(wins   / total) * 100}%` }} />
                    <div className="wrb-segment wrb-draws" style={{ width: `${(draws  / total) * 100}%` }} />
                    <div className="wrb-segment wrb-loss"  style={{ width: `${(losses / total) * 100}%` }} />
                  </div>
                  <div className="wrb-labels">
                    <span className="wrb-l wins">{wr}% Wins</span>
                    <span className="wrb-l draws">{total > 0 ? Math.round((draws / total) * 100) : 0}% Draws</span>
                    <span className="wrb-l losses">{total > 0 ? Math.round((losses / total) * 100) : 0}% Losses</span>
                  </div>
                </div>
              )}

              {/* Stats grid */}
              <div className="ppage-stats-section-heading">
                <TrendingUp size={15} />
                <span>Fleet Performance</span>
              </div>
              <div className="ppage-stats-grid">
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(245,158,11,0.15)', borderColor: '#f59e0b' }}>
                    <Trophy size={20} style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{elo.toLocaleString()}</span>
                    <span className="pstat-label">ELO Rating</span>
                  </div>
                </div>
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(96,165,250,0.15)', borderColor: '#60a5fa' }}>
                    <Shield size={20} style={{ color: '#60a5fa' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{wr}%</span>
                    <span className="pstat-label">Win Rate</span>
                  </div>
                </div>
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(52,211,153,0.15)', borderColor: '#34d399' }}>
                    <Zap size={20} style={{ color: '#34d399' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{wins}W – {losses}L</span>
                    <span className="pstat-label">W / L Record</span>
                  </div>
                </div>
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(167,139,250,0.15)', borderColor: '#a78bfa' }}>
                    <Globe size={20} style={{ color: '#a78bfa' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{rank}</span>
                    <span className="pstat-label">Global Rank</span>
                  </div>
                </div>
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(251,191,36,0.15)', borderColor: '#fbbf24' }}>
                    <Coins size={20} style={{ color: '#fbbf24' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{coins.toLocaleString()}</span>
                    <span className="pstat-label">Treasury Gold</span>
                  </div>
                </div>
                <div className="pstat-card">
                  <div className="pstat-icon-wrap" style={{ background: 'rgba(248,113,113,0.15)', borderColor: '#f87171' }}>
                    <Star size={20} style={{ color: '#f87171' }} />
                  </div>
                  <div className="pstat-info">
                    <span className="pstat-num">{draws}</span>
                    <span className="pstat-label">Draws</span>
                  </div>
                </div>
              </div>

              {/* Rank tier display */}
              <div className="ppage-stats-section-heading" style={{ marginTop: 20 }}>
                <Medal size={15} />
                <span>Rank Tiers</span>
              </div>
              <div className="ppage-tier-ladder">
                {RANK_TIERS.map((t) => {
                  const isActive = tier.label === t.label
                  return (
                    <div
                      key={t.label}
                      className={`tier-rung ${isActive ? 'tier-rung-active' : ''}`}
                      style={isActive ? { borderColor: t.color, background: `${t.color}18` } : {}}
                    >
                      <span className="tr-icon">{t.icon}</span>
                      <span className="tr-label" style={isActive ? { color: t.color } : {}}>{t.label}</span>
                      <span className="tr-min">{t.min.toLocaleString()}+ ELO</span>
                      {isActive && <span className="tr-you-badge">YOU</span>}
                    </div>
                  )
                })}
              </div>

              {/* Guest prompt */}
              {!isAuthenticated && (
                <div className="ppage-guest-banner">
                  <Crown size={20} />
                  <div>
                    <strong>Playing as Guest</strong>
                    <p>Create an account to save your ELO, battle history, and treasury gold permanently.</p>
                  </div>
                  <button
                    className="btn-ppage-enlist-inline"
                    onClick={() => { navigationStore.returnToLanding(); authStore.openAuthModal() }}
                  >
                    Join Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── BATTLE HISTORY TAB ──────────────────────────────────── */}
          {activeTab === 'history' && (
            <div className="ppage-history">
              <div className="ppage-section-heading">
                <Swords size={18} className="heading-icon" />
                <h3>Battle History</h3>
                <button
                  className="ppage-refresh-btn"
                  onClick={fetchHistory}
                  title="Refresh"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {!isAuthenticated ? (
                <div className="ppage-auth-required">
                  <Swords size={32} />
                  <p>Log in to view your battle history.</p>
                </div>
              ) : loading ? (
                <div className="ppage-loading">
                  <div className="ppage-spinner" />
                  <span>Retrieving battle logs...</span>
                </div>
              ) : matchHistory.length === 0 ? (
                <div className="ppage-empty">
                  <Swords size={36} />
                  <p>No completed battles yet. Set sail and claim glory!</p>
                </div>
              ) : (
                <div className="ppage-history-list">
                  {/* Table header */}
                  <div className="phist-header">
                    <span>Result</span>
                    <span>Mode</span>
                    <span>Opponent</span>
                    <span>Moves</span>
                    <span>Outcome</span>
                    <span>When</span>
                  </div>

                  {matchHistory.map((match) => {
                    const result = getMatchResult(match)
                    const opp    = getOpponentName(match)
                    const mode   = MODE_LABELS[match.mode] ?? { label: match.mode, icon: '♟️', color: '#6b7280' }
                    return (
                      <div
                        key={match.id}
                        className={`phist-row phist-${result}`}
                      >
                        <div className="phist-result-col">
                          <span className={`phist-result-badge phist-badge-${result}`}>
                            {result === 'win' ? 'WIN' : result === 'loss' ? 'LOSS' : result === 'draw' ? 'DRAW' : '—'}
                          </span>
                        </div>
                        <div className="phist-mode-col">
                          <span className="phist-mode-icon">{mode.icon}</span>
                          <span className="phist-mode-label" style={{ color: mode.color }}>{mode.label}</span>
                        </div>
                        <div className="phist-opp-col">
                          <span className="phist-opp-avatar">🏴‍☠️</span>
                          <span>{opp}</span>
                        </div>
                        <div className="phist-moves-col">{match.move_count}</div>
                        <div className="phist-reason-col">{match.end_reason || 'Completed'}</div>
                        <div className="phist-when-col">{formatTimeAgo(match.updated_at)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── LEADERBOARD TAB ─────────────────────────────────────── */}
          {activeTab === 'leaderboard' && (
            <div className="ppage-leaderboard">
              <div className="ppage-section-heading">
                <Trophy size={18} className="heading-icon" />
                <h3>High Seas Rankings</h3>
                <button className="ppage-refresh-btn" onClick={fetchLeaderboard} title="Refresh">
                  <RotateCcw size={14} />
                </button>
              </div>

              {loading ? (
                <div className="ppage-loading">
                  <div className="ppage-spinner" />
                  <span>Charting top fleets...</span>
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="ppage-empty">
                  <Trophy size={36} />
                  <p>No ranked battles yet. Be the first to claim glory!</p>
                </div>
              ) : (
                <div className="ppage-lb-list">
                  <div className="plb-header">
                    <span>#</span>
                    <span>Commander</span>
                    <span>ELO</span>
                    <span>W / L</span>
                    <span>Win Rate</span>
                    <span>Battles</span>
                  </div>
                  {leaderboard.map((item, idx) => {
                    const rank = idx + 1
                    const isMe = user && user.username === item.username
                    const itemTier = getTier(item.rating_elo)
                    const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
                    return (
                      <div
                        key={item.id}
                        className={`plb-row ${isMe ? 'plb-row-me' : ''} ${rank <= 3 ? `plb-top${rank}` : ''}`}
                      >
                        <div className="plb-rank-col">
                          {medalEmoji
                            ? <span className="plb-medal">{medalEmoji}</span>
                            : <span className="plb-num">#{rank}</span>
                          }
                        </div>
                        <div className="plb-name-col">
                          <span className="plb-tier-icon">{itemTier.icon}</span>
                          <div className="plb-name-info">
                            <span className="plb-name">
                              {item.nickname || item.username}
                              {isMe && <span className="plb-you-tag">YOU</span>}
                            </span>
                            <span className="plb-at">@{item.username}</span>
                          </div>
                        </div>
                        <div className="plb-elo-col" style={{ color: itemTier.color }}>
                          {item.rating_elo.toLocaleString()}
                        </div>
                        <div className="plb-wl-col">
                          <span className="plb-w">{item.wins}W</span>
                          <span className="plb-sep">/</span>
                          <span className="plb-l">{item.losses}L</span>
                        </div>
                        <div className={`plb-wr-col ${item.win_rate >= 50 ? 'plb-wr-good' : 'plb-wr-bad'}`}>
                          {item.win_rate}%
                        </div>
                        <div className="plb-total-col">{item.total_matches}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
