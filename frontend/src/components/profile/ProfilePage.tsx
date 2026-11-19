import type { FC } from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Trophy, LogOut, Crown, Shield, Target,
  Calendar, Eye, Swords, UserPlus, MessageSquare, Share2,
  MoreVertical, Clock, Flame, Anchor, Award, Users,
  CheckCircle2, Download, Search,
  Compass, Coins, User,
} from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { navigationStore, useNavigationStore } from '../../state/appNavigationStore'
import { api } from '../../api/client'
import type { UserProfileData, MatchData } from '../../api/client'
import { audioEngine } from '../../audio/audioEngine'
import { getGuestDisplayName } from '../../utils/guestSession'

// ─── Default Reference Data (when user has fewer matches) ──────────────────

interface EngagementItem {
  id: string
  opponentName: string
  opponentRating: number
  opponentAvatar: string
  modeTitle: string
  modeSub: string
  fleetSide: 'White Fleet' | 'Black Fleet'
  accuracy: number
  moves: number
  duration: string
  deltaElo: number
  result: 'W' | 'L' | 'D'
}

const DEFAULT_ENGAGEMENTS: EngagementItem[] = [
  {
    id: 'eng-1',
    opponentName: 'Commander Drake',
    opponentRating: 1240,
    opponentAvatar: '🏴‍☠️',
    modeTitle: 'Royale Flagship',
    modeSub: '5 min Blitz',
    fleetSide: 'White Fleet',
    accuracy: 91.4,
    moves: 32,
    duration: '4m 12s',
    deltaElo: 26,
    result: 'W',
  },
  {
    id: 'eng-2',
    opponentName: 'Lady Mara',
    opponentRating: 1275,
    opponentAvatar: '⚓',
    modeTitle: 'Royale Flagship',
    modeSub: '10 min Rapid',
    fleetSide: 'Black Fleet',
    accuracy: 88.2,
    moves: 24,
    duration: '6m 45s',
    deltaElo: 22,
    result: 'W',
  },
  {
    id: 'eng-3',
    opponentName: 'GM Ivan K.',
    opponentRating: 1340,
    opponentAvatar: '👑',
    modeTitle: 'Normal Chess',
    modeSub: '3 min Blitz',
    fleetSide: 'White Fleet',
    accuracy: 76.8,
    moves: 48,
    duration: '2m 58s',
    deltaElo: -16,
    result: 'L',
  },
  {
    id: 'eng-4',
    opponentName: 'Sea Dog Jack',
    opponentRating: 1150,
    opponentAvatar: '🦜',
    modeTitle: 'Royale Flagship',
    modeSub: '5 min Blitz',
    fleetSide: 'Black Fleet',
    accuracy: 94.1,
    moves: 19,
    duration: '3m 22s',
    deltaElo: 19,
    result: 'W',
  },
  {
    id: 'eng-5',
    opponentName: 'Capt. Blackbeard',
    opponentRating: 1290,
    opponentAvatar: '⚔️',
    modeTitle: 'Blitz Skirmish',
    modeSub: '3 min Blitz',
    fleetSide: 'White Fleet',
    accuracy: 84.5,
    moves: 52,
    duration: '3m 00s',
    deltaElo: 1,
    result: 'D',
  },
]

const FLEET_ALLIES = [
  {
    id: 'a1',
    name: 'Admiral Vance',
    rating: 1280,
    avatar: '👨‍✈️',
    status: 'Playing Royale #291',
    online: true,
    action: 'watch',
  },
  {
    id: 'a2',
    name: 'QueenAnne',
    rating: 1300,
    avatar: '👸',
    status: 'In Harbor • Idle',
    online: true,
    action: 'duel',
  },
  {
    id: 'a3',
    name: 'Thorne_Tactics',
    rating: 1195,
    avatar: '🧙‍♂️',
    status: 'In Harbor • Idle',
    online: true,
    action: 'duel',
  },
  {
    id: 'a4',
    name: 'Navigator_Finn',
    rating: 1140,
    avatar: '🧭',
    status: 'Away • 2h ago',
    online: false,
    action: 'message',
  },
]

export const ProfilePage: FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { currentScreen } = useNavigationStore()
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([])
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([])
  const [showRankingsModal, setShowRankingsModal] = useState(false)
  const [activeHistoryFilter, setActiveHistoryFilter] = useState<'all' | 'royale' | 'classic' | 'tournaments'>('all')
  const [activeAnalyticsFilter, setActiveAnalyticsFilter] = useState<'30D' | '90D' | '1Y' | 'ALL'>('90D')
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  // Fetch real match history if logged in
  useEffect(() => {
    if (currentScreen !== 'profile') return
    if (isAuthenticated) {
      api.getMatchHistory()
        .then((data) => setMatchHistory(data.filter((m) => m.status === 'completed').slice(0, 15)))
        .catch(() => setMatchHistory([]))
    }
  }, [currentScreen, isAuthenticated])

  const fetchRankings = useCallback(() => {
    api.getLeaderboard(20)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
  }, [])

  if (currentScreen !== 'profile') return null

  // User Stats & Identity
  const displayName = user ? (user.nickname || user.username) : getGuestDisplayName()
  const normalElo = user?.normal_rating ?? 1180
  const royaleElo = user?.royale_rating ?? 1238
  const totalBattles = user?.total_matches ? user.total_matches : 203
  const wins = user?.total_matches ? user.wins : 127
  const draws = user?.total_matches ? user.draws : 17
  const losses = user?.total_matches ? user.losses : 59
  const winRate = user?.total_matches
    ? Number(user.win_rate.toFixed(1))
    : Number(((wins / totalBattles) * 100).toFixed(1))
  const coins = user?.persistent_coins ?? 155
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Oct 2023'

  // Win, Draw, Loss percentages
  const wPct = Math.round((wins / totalBattles) * 100)
  const dPct = Math.round((draws / totalBattles) * 100)
  const lPct = Math.max(0, 100 - wPct - dPct)

  const handleLogout = async () => {
    audioEngine.playButtonClick()
    await authStore.logout()
  }

  // Convert real matches to engagement items if available
  const displayEngagements: EngagementItem[] = matchHistory.length > 0
    ? matchHistory.map((m) => {
        const iAmWhite = user && m.white_player === user.id
        const oppName = iAmWhite
          ? (m.black_username || m.black_guest_name || 'Commander')
          : (m.white_username || m.white_guest_name || 'Commander')
        const isWin = (iAmWhite && m.winner === 'w') || (!iAmWhite && m.winner === 'b')
        const isDraw = m.winner === 'draw'
        const result: 'W' | 'L' | 'D' = isWin ? 'W' : isDraw ? 'D' : 'L'
        const isRoyale = m.mode.includes('royale')

        return {
          id: m.id,
          opponentName: oppName,
          opponentRating: 1200,
          opponentAvatar: isRoyale ? '🏴‍☠️' : '♟️',
          modeTitle: isRoyale ? 'Royale Flagship' : 'Normal Chess',
          modeSub: '5 min Blitz',
          fleetSide: iAmWhite ? 'White Fleet' : 'Black Fleet',
          accuracy: isWin ? 92.5 : isDraw ? 84.0 : 78.2,
          moves: m.move_count,
          duration: `${Math.max(2, Math.floor(m.move_count / 8))}m ${((m.move_count * 11) % 60)}s`,
          deltaElo: isWin ? 20 : isDraw ? 1 : -16,
          result,
        }
      })
    : DEFAULT_ENGAGEMENTS

  return (
    <div className="rc-profile-screen">

      {/* ═══════════════ 1. TOP HEADER (Matches Landing Page) ════════════ */}
      <header className="landing-header profile-landing-header">
        <div
          className="landing-brand"
          onClick={() => navigationStore.returnToLanding()}
          style={{ cursor: 'pointer' }}
          title="Return to lobby"
        >
          <div className="brand-logo-icon">
            <Crown size={22} className="crown-icon" />
          </div>
          <div className="brand-text-group">
            <h1 className="brand-title">ROYAL CHESS</h1>
            <span className="brand-tag">STRATEGY &amp; CLASSIC</span>
          </div>
        </div>

        <nav className="landing-nav">
          <button
            className="nav-item nav-item-play"
            onClick={() => navigationStore.returnToLanding()}
          >
            Play
          </button>
          <button
            className="nav-item nav-item-pvp"
            onClick={() => navigationStore.returnToLanding()}
          >
            Pass &amp; Play
          </button>
          <button
            className="nav-item nav-item-rankings active"
            onClick={() => {
              fetchRankings()
              setShowRankingsModal(true)
            }}
          >
            <Trophy size={14} />
            <span className="rankings-label">Rankings</span>
          </button>

          {/* Profile / Auth Pill */}
          {isAuthenticated && user ? (
            <div
              className="nav-profile-pill active-nav-pill"
              title="Current Commander Profile"
            >
              <div className="nav-avatar">🏴‍☠️</div>
              <div className="nav-user-info">
                <span className="nav-nickname">{user.nickname || user.username}</span>
                <div className="nav-stats-row">
                  <span className="nav-elo">
                    <Trophy size={11} /> {user.rating_elo}
                  </span>
                  <span className="nav-coins">
                    <Coins size={11} /> {coins}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="nav-guest-group">
              <div
                className="nav-guest-pill"
                title="Current Guest Session"
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

          {/* Return to Lobby action button */}
          <button
            className="btn-nav-lobby"
            onClick={() => navigationStore.returnToLanding()}
            title="Return to Main Menu"
          >
            <ArrowLeft size={14} />
            <span>Lobby</span>
          </button>

          {/* Log Out button if authenticated */}
          {isAuthenticated && (
            <button
              className="btn-nav-logout"
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut size={14} />
            </button>
          )}
        </nav>
      </header>

      {/* ═══════════════ MAIN SCROLLABLE CONTAINER ═════════════════════════ */}
      <main className="rc-profile-container">

        {/* ════════════ 2. HERO PROFILE HEADER ════════════════════════════ */}
        <section className="rc-hero-card">
          {/* Status badges top-right */}
          <div className="rc-hero-status-row">
            <span className="rc-status-pill rc-status-online">
              <span className="rc-online-dot" /> Online Now • In Harbor
            </span>
            <span className="rc-status-pill rc-status-verified">
              <CheckCircle2 size={13} /> Verified Admiral
            </span>
          </div>

          <div className="rc-hero-main-content">
            {/* Avatar Column */}
            <div className="rc-hero-avatar-box">
              <div className="rc-hero-avatar-frame">
                {!avatarLoadError ? (
                  <img
                    src="/admiral-avatar.png"
                    alt={displayName}
                    className="rc-hero-avatar-img"
                    onError={() => setAvatarLoadError(true)}
                  />
                ) : (
                  <div className="rc-hero-avatar-fallback">👑</div>
                )}
                {/* Level badge */}
                <div className="rc-hero-lvl-badge">LVL 48</div>
                {/* Green online dot */}
                <div className="rc-hero-avi-online" />
              </div>
            </div>

            {/* Profile Bio Details */}
            <div className="rc-hero-bio-section">
              <div className="rc-hero-name-heading">
                <h1 className="rc-hero-username">{displayName}</h1>
                <span className="rc-hero-title-tag">GRANDMASTER • FLEET ADMIRAL II</span>
              </div>

              <div className="rc-hero-region">
                <span className="rc-flag-icon">🇮🇳</span>
                <span className="rc-region-text">IN / IND</span>
              </div>

              <p className="rc-hero-motto">
                Naval chess tactician • Royale Mode enthusiast • Streaming high seas maneuvers &amp; King-defense cauldrons.
              </p>

              <div className="rc-hero-meta-row">
                <span className="rc-hero-meta-item">
                  <Calendar size={13} /> Joined {joinedDate}
                </span>
                <span className="rc-hero-meta-item">
                  <Eye size={13} /> 12.4k Views
                </span>
                <span className="rc-hero-meta-item rc-meta-gold">
                  <Trophy size={13} /> Rank #1,420 Global
                </span>
              </div>
            </div>

            {/* Action Buttons Column */}
            <div className="rc-hero-actions-section">
              <div className="rc-hero-cta-buttons">
                <button
                  className="rc-btn-duel"
                  onClick={() => navigationStore.returnToLanding()}
                >
                  <Swords size={16} />
                  <span>Challenge to Duel</span>
                </button>
                <button className="rc-btn-secondary">
                  <UserPlus size={15} />
                  <span>Add Friend</span>
                </button>
                <button className="rc-btn-secondary">
                  <MessageSquare size={15} />
                  <span>Message</span>
                </button>
              </div>

              <div className="rc-hero-icon-actions">
                <button className="rc-btn-icon-subtle" title="Share Profile">
                  <Share2 size={15} />
                </button>
                <button className="rc-btn-icon-subtle" title="More options">
                  <MoreVertical size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ 3. FOUR MODE STAT CARDS ═══════════════════════════ */}
        <section className="rc-modes-grid">
          {/* Card 1: Flagship Royale */}
          <div className="rc-mode-card rc-card-royale">
            <div className="rc-mode-card-header">
              <div className="rc-mode-icon-title">
                <Crown size={16} className="rc-mode-icon-gold" />
                <div>
                  <span className="rc-mode-category">FLAGSHIP MODE</span>
                  <span className="rc-mode-name">Royale Strategy</span>
                </div>
              </div>
              <span className="rc-mode-tag rc-tag-gold">TOP 4.2%</span>
            </div>

            <div className="rc-mode-stats-row">
              <div className="rc-mode-main-number">
                <span className="rc-rating-val">{royaleElo.toLocaleString()}</span>
                <span className="rc-rating-trend rc-trend-up">↗ +34</span>
              </div>
              <div className="rc-mode-peak-info">
                <span className="rc-peak-lbl">PEAK RATING</span>
                <span className="rc-peak-val">1,310</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="rc-mode-sparkline">
              <svg viewBox="0 0 200 45" className="rc-sparkline-svg">
                <path
                  d="M 5,38 C 40,36 60,34 90,26 C 120,18 150,22 175,8 C 185,4 190,12 195,14"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="195" cy="14" r="3.5" fill="#f59e0b" />
              </svg>
            </div>

            <div className="rc-mode-card-footer">
              <span className="rc-footer-winrate">Winrate: <strong>64%</strong></span>
              <span className="rc-footer-wdl">89W • 43L • 10D</span>
            </div>
          </div>

          {/* Card 2: Standard FIDE Normal Chess */}
          <div className="rc-mode-card rc-card-normal">
            <div className="rc-mode-card-header">
              <div className="rc-mode-icon-title">
                <Shield size={16} className="rc-mode-icon-blue" />
                <div>
                  <span className="rc-mode-category">STANDARD FIDE</span>
                  <span className="rc-mode-name">Normal 8×8 Chess</span>
                </div>
              </div>
              <span className="rc-mode-tag rc-tag-blue">TOP 9.8%</span>
            </div>

            <div className="rc-mode-stats-row">
              <div className="rc-mode-main-number">
                <span className="rc-rating-val">{normalElo.toLocaleString()}</span>
                <span className="rc-rating-trend rc-trend-neutral">± 0</span>
              </div>
              <div className="rc-mode-peak-info">
                <span className="rc-peak-lbl">PEAK RATING</span>
                <span className="rc-peak-val">1,205</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="rc-mode-sparkline">
              <svg viewBox="0 0 200 45" className="rc-sparkline-svg">
                <path
                  d="M 5,30 C 50,30 80,32 110,24 C 140,16 160,20 195,18"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="195" cy="18" r="3.5" fill="#38bdf8" />
              </svg>
            </div>

            <div className="rc-mode-card-footer">
              <span className="rc-footer-winrate">Winrate: <strong>58%</strong></span>
              <span className="rc-footer-wdl">34W • 22L • 5D</span>
            </div>
          </div>

          {/* Card 3: Maneuver Puzzles */}
          <div className="rc-mode-card rc-card-puzzles">
            <div className="rc-mode-card-header">
              <div className="rc-mode-icon-title">
                <Target size={16} className="rc-mode-icon-green" />
                <div>
                  <span className="rc-mode-category">MANEUVER PUZZLES</span>
                  <span className="rc-mode-name">Tactical Trials</span>
                </div>
              </div>
              <span className="rc-mode-tag rc-tag-green">STREAK: 14</span>
            </div>

            <div className="rc-mode-stats-row">
              <div className="rc-mode-main-number">
                <span className="rc-rating-val">1,650</span>
                <span className="rc-rating-trend rc-trend-up">↗ +420</span>
              </div>
              <div className="rc-mode-peak-info">
                <span className="rc-peak-lbl">SUCCESS RATE</span>
                <span className="rc-peak-val" style={{ color: '#22c55e' }}>83.2%</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="rc-mode-sparkline">
              <svg viewBox="0 0 200 45" className="rc-sparkline-svg">
                <path
                  d="M 5,36 C 45,34 75,28 115,18 C 145,10 170,16 195,6"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="195" cy="6" r="3.5" fill="#22c55e" />
              </svg>
            </div>

            <div className="rc-mode-card-footer">
              <span className="rc-footer-winrate">Fastest: <strong>4.2s</strong></span>
              <span className="rc-footer-wdl">Best Streak: 14 in a row</span>
            </div>
          </div>

          {/* Card 4: Local & Fast Blitz */}
          <div className="rc-mode-card rc-card-blitz">
            <div className="rc-mode-card-header">
              <div className="rc-mode-icon-title">
                <Flame size={16} className="rc-mode-icon-orange" />
                <div>
                  <span className="rc-mode-category">LOCAL &amp; FAST</span>
                  <span className="rc-mode-name">Blitz Skirmish</span>
                </div>
              </div>
              <span className="rc-mode-tag rc-tag-orange">5m • 3m</span>
            </div>

            <div className="rc-mode-stats-row">
              <div className="rc-mode-main-number">
                <span className="rc-rating-val">1,212</span>
                <span className="rc-rating-trend rc-trend-up">↗ +12</span>
              </div>
              <div className="rc-mode-peak-info">
                <span className="rc-peak-lbl">TOTAL BATTLES</span>
                <span className="rc-peak-val">118</span>
              </div>
            </div>

            {/* Sparkline curve */}
            <div className="rc-mode-sparkline">
              <svg viewBox="0 0 200 45" className="rc-sparkline-svg">
                <path
                  d="M 5,34 C 40,32 80,30 110,26 C 140,22 170,16 195,12"
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="195" cy="12" r="3.5" fill="#fb923c" />
              </svg>
            </div>

            <div className="rc-mode-card-footer">
              <span className="rc-footer-winrate">Winrate: <strong>61%</strong></span>
              <span className="rc-footer-wdl">62W • 38L • 18D</span>
            </div>
          </div>
        </section>

        {/* ════════════ 4. TWO-COLUMN DASHBOARD SECTION ═══════════════════ */}
        <section className="rc-dashboard-grid">

          {/* ────── LEFT COLUMN (ANALYTICS & ENGAGEMENTS) ────── */}
          <div className="rc-dash-col-left">

            {/* Card: Battlefield Rating Analytics */}
            <div className="rc-dash-card rc-analytics-card">
              <div className="rc-dash-card-header">
                <div className="rc-dash-card-title">
                  <Compass size={17} className="rc-title-gold-icon" />
                  <span>Battlefield Rating Analytics</span>
                </div>
                {/* Time filter buttons */}
                <div className="rc-pill-filter-group">
                  {(['30D', '90D', '1Y', 'ALL'] as const).map((filter) => (
                    <button
                      key={filter}
                      className={`rc-pill-filter-btn ${activeAnalyticsFilter === filter ? 'active' : ''}`}
                      onClick={() => setActiveAnalyticsFilter(filter)}
                    >
                      {filter === '1Y' ? '1 Year' : filter === 'ALL' ? 'All Time' : filter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subheader with legend */}
              <div className="rc-analytics-legend-row">
                <div className="rc-analytics-legends">
                  <span className="rc-legend-item">
                    <span className="rc-legend-dot" style={{ background: '#f59e0b' }} />
                    Royale ELO (Peak 1,310)
                  </span>
                  <span className="rc-legend-item">
                    <span className="rc-legend-dot" style={{ background: '#38bdf8' }} />
                    Classic ELO (Peak 1,205)
                  </span>
                </div>
                <span className="rc-analytics-date-range">Mar 2024 - May 2024</span>
              </div>

              {/* High-fidelity Area Chart */}
              <div className="rc-chart-wrapper">
                <div className="rc-chart-y-axis">
                  <span>1320</span>
                  <span>1260</span>
                  <span>1200</span>
                  <span>1140</span>
                </div>

                <div className="rc-chart-canvas">
                  <svg viewBox="0 0 540 140" preserveAspectRatio="none" className="rc-area-chart-svg">
                    <defs>
                      <linearGradient id="royaleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#d97706" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#78350f" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="classicGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle grid lines */}
                    <line x1="0" y1="20" x2="540" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="0" y1="55" x2="540" y2="55" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="0" y1="90" x2="540" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                    <line x1="0" y1="125" x2="540" y2="125" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                    {/* Classic line (subtle blue baseline) */}
                    <path
                      d="M 0,110 C 90,105 180,102 270,98 C 360,94 450,92 540,90 L 540,140 L 0,140 Z"
                      fill="url(#classicGrad)"
                    />
                    <path
                      d="M 0,110 C 90,105 180,102 270,98 C 360,94 450,92 540,90"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                      strokeOpacity="0.75"
                    />

                    {/* Royale line (main glowing amber curve with peak badge) */}
                    <path
                      d="M 0,98 C 60,96 110,88 180,82 C 240,78 300,52 380,36 C 420,28 470,25 540,32 L 540,140 L 0,140 Z"
                      fill="url(#royaleGrad)"
                    />
                    <path
                      d="M 0,98 C 60,96 110,88 180,82 C 240,78 300,52 380,36 C 420,28 470,25 540,32"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.8"
                    />
                  </svg>

                  {/* Peak Rating Badge pinned above curve */}
                  <div className="rc-chart-peak-pin" style={{ left: '68%', top: '15%' }}>
                    <span>1,310 PEAK</span>
                  </div>
                </div>

                <div className="rc-chart-x-axis">
                  <span>Mar 01</span>
                  <span>Mar 15</span>
                  <span>Apr 01</span>
                  <span>Apr 15</span>
                  <span>May 01</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Overall Battle Record summary */}
              <div className="rc-record-summary-box">
                <div className="rc-record-header">
                  <span className="rc-record-title">Overall Battle Record ({totalBattles} Battles Evaluated)</span>
                  <span className="rc-record-winrate-tag">{winRate}% Victory Rate</span>
                </div>

                {/* Segmented bar */}
                <div className="rc-tri-bar">
                  <div className="rc-tri-seg rc-seg-wins" style={{ width: `${wPct}%` }} />
                  <div className="rc-tri-seg rc-seg-draws" style={{ width: `${dPct}%` }} />
                  <div className="rc-tri-seg rc-seg-losses" style={{ width: `${lPct}%` }} />
                </div>

                <div className="rc-record-breakdown-row">
                  <div className="rc-record-breakdown-left">
                    <span className="rc-bd-item rc-bd-w">
                      <span className="rc-bd-dot rc-bd-dot-w" /> {wins} Wins ({wPct}%)
                    </span>
                    <span className="rc-bd-item rc-bd-d">
                      <span className="rc-bd-dot rc-bd-dot-d" /> {draws} Draws ({dPct}%)
                    </span>
                    <span className="rc-bd-item rc-bd-l">
                      <span className="rc-bd-dot rc-bd-dot-l" /> {losses} Losses ({lPct}%)
                    </span>
                  </div>
                  <span className="rc-streak-text">Current Streak: 4 Wins</span>
                </div>
              </div>

              {/* 5 Naval Badge metrics */}
              <div className="rc-mini-metrics-row">
                <div className="rc-metric-cell">
                  <Crown size={17} className="rc-cell-gold-icon" />
                  <span className="rc-metric-val">54</span>
                  <span className="rc-metric-lbl">CHECKMATES</span>
                </div>
                <div className="rc-metric-cell">
                  <Flame size={17} className="rc-cell-gold-icon" />
                  <span className="rc-metric-val">198</span>
                  <span className="rc-metric-lbl">CAULDRONS WON</span>
                </div>
                <div className="rc-metric-cell">
                  <Shield size={17} className="rc-cell-gold-icon" />
                  <span className="rc-metric-val">342</span>
                  <span className="rc-metric-lbl">REINFORCEMENTS</span>
                </div>
                <div className="rc-metric-cell">
                  <Clock size={17} className="rc-cell-gold-icon" />
                  <span className="rc-metric-val">5m 40s</span>
                  <span className="rc-metric-lbl">AVG TIME</span>
                </div>
                <div className="rc-metric-cell">
                  <Trophy size={17} className="rc-cell-gold-icon" />
                  <span className="rc-metric-val">7 Wins</span>
                  <span className="rc-metric-lbl">BEST RUN</span>
                </div>
              </div>
            </div>

            {/* Card: Recent Fleet Engagements (Match History) */}
            <div className="rc-dash-card rc-engagements-card">
              <div className="rc-dash-card-header">
                <div className="rc-dash-card-title">
                  <Swords size={17} className="rc-title-gold-icon" />
                  <span>Recent Fleet Engagements</span>
                </div>
                <div className="rc-pill-filter-group">
                  <button
                    className={`rc-pill-filter-btn ${activeHistoryFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryFilter('all')}
                  >
                    All Modes
                  </button>
                  <button
                    className={`rc-pill-filter-btn ${activeHistoryFilter === 'royale' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryFilter('royale')}
                  >
                    Royale Only
                  </button>
                  <button
                    className={`rc-pill-filter-btn ${activeHistoryFilter === 'classic' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryFilter('classic')}
                  >
                    Classic 8×8
                  </button>
                  <button
                    className={`rc-pill-filter-btn ${activeHistoryFilter === 'tournaments' ? 'active' : ''}`}
                    onClick={() => setActiveHistoryFilter('tournaments')}
                  >
                    Tournaments
                  </button>
                </div>
              </div>

              {/* Engagements list */}
              <div className="rc-engagements-list">
                {displayEngagements.map((item) => (
                  <div key={item.id} className={`rc-engagement-row rc-eng-${item.result.toLowerCase()}`}>
                    {/* W/L badge */}
                    <div className="rc-eng-badge-cell">
                      <span className={`rc-eng-res-badge rc-res-${item.result.toLowerCase()}`}>
                        {item.result === 'D' ? '½' : item.result}
                      </span>
                    </div>

                    {/* Opponent & match details */}
                    <div className="rc-eng-opp-info">
                      <div className="rc-eng-opp-name-row">
                        <span className="rc-eng-opp-avi">{item.opponentAvatar}</span>
                        <span className="rc-eng-opp-name">{item.opponentName}</span>
                        <span className="rc-eng-opp-rating">({item.opponentRating})</span>
                        <span className="rc-pirate-flag-icon">🏴‍☠️</span>
                      </div>
                      <div className="rc-eng-mode-sub">
                        <span>{item.modeTitle}</span>
                        <span>•</span>
                        <span>{item.modeSub}</span>
                        <span>•</span>
                        <span className="rc-fleet-side-txt">{item.fleetSide}</span>
                      </div>
                    </div>

                    {/* Accuracy */}
                    <div className="rc-eng-accuracy-cell">
                      <span className="rc-eng-cell-sub">ACCURACY</span>
                      <span className="rc-eng-acc-val">{item.accuracy}%</span>
                    </div>

                    {/* Moves / Time */}
                    <div className="rc-eng-moves-cell">
                      <span className="rc-eng-cell-sub">MOVES / TIME</span>
                      <span className="rc-eng-moves-val">{item.moves} m • {item.duration}</span>
                    </div>

                    {/* Delta ELO */}
                    <div className="rc-eng-delta-cell">
                      <span className="rc-eng-cell-sub">DELTA</span>
                      <span className={`rc-eng-delta-val ${item.deltaElo >= 0 ? 'rc-delta-plus' : 'rc-delta-minus'}`}>
                        {item.deltaElo >= 0 ? `+${item.deltaElo}` : item.deltaElo} ELO
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="rc-eng-actions-cell">
                      <button className="rc-eng-btn-analyze" title="Open Game Analysis">
                        <Search size={12} />
                        <span>Analyze</span>
                      </button>
                      <button className="rc-eng-btn-download" title="Download PGN">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* View Full Logbook footer */}
              <div className="rc-engagements-footer">
                <button
                  className="rc-view-logbook-btn"
                  onClick={() => {
                    fetchRankings()
                    setShowRankingsModal(true)
                  }}
                >
                  View Full Logbook &amp; PGN Vault ({totalBattles} Battles) &gt;
                </button>
              </div>
            </div>
          </div>

          {/* ────── RIGHT COLUMN (ARMADA, TROPHIES, ALLIES) ────── */}
          <div className="rc-dash-col-right">

            {/* 1. ACTIVE ARMADA Card */}
            <div className="rc-dash-card rc-armada-card">
              <div className="rc-armada-header">
                <div className="rc-armada-title-wrap">
                  <span className="rc-armada-cat-lbl">ACTIVE ARMADA</span>
                  <div className="rc-armada-name-row">
                    <Anchor size={20} className="rc-armada-anchor-icon" />
                    <span className="rc-armada-name">Armada of the Kraken</span>
                  </div>
                  <span className="rc-armada-members">120 Navigators • Leader: @KrakenBane</span>
                </div>
                <span className="rc-armada-rank-badge">FLEET RANK #8</span>
              </div>

              <p className="rc-armada-desc">
                Competitive naval chess syndicate dominating weekly Royale Mode clan wars and quadrant leaderboards.
              </p>

              <div className="rc-armada-actions">
                <button className="rc-btn-armada-subtle">
                  <Anchor size={14} />
                  <span>Fleet Quarters</span>
                </button>
                <button className="rc-btn-armada-gold">
                  <Swords size={14} />
                  <span>Fleet War</span>
                </button>
              </div>
            </div>

            {/* 2. Nautical Trophies Card */}
            <div className="rc-dash-card rc-trophies-card">
              <div className="rc-dash-card-header">
                <div className="rc-dash-card-title">
                  <Trophy size={16} className="rc-title-gold-icon" />
                  <span>Nautical Trophies</span>
                </div>
                <span className="rc-trophy-count">24 / 36 Unlocked</span>
              </div>

              <div className="rc-trophies-row">
                <div className="rc-trophy-badge" title="First Blood - Tier III">
                  <div className="rc-trophy-icon-circle rc-tcircle-gold">
                    <Award size={18} />
                  </div>
                  <span className="rc-trophy-name">First Blood</span>
                  <span className="rc-trophy-tier">Tier III</span>
                </div>

                <div className="rc-trophy-badge" title="Cauldron Master - Tier II">
                  <div className="rc-trophy-icon-circle rc-tcircle-bronze">
                    <Flame size={18} />
                  </div>
                  <span className="rc-trophy-name">Cauldron...</span>
                  <span className="rc-trophy-tier">Tier II</span>
                </div>

                <div className="rc-trophy-badge" title="Anchor Down - Tier IV">
                  <div className="rc-trophy-icon-circle rc-tcircle-blue">
                    <Anchor size={18} />
                  </div>
                  <span className="rc-trophy-name">Anchor...</span>
                  <span className="rc-trophy-tier">Tier IV</span>
                </div>

                <div className="rc-trophy-badge" title="100 Checkmates - Master">
                  <div className="rc-trophy-icon-circle rc-tcircle-green">
                    <Crown size={18} />
                  </div>
                  <span className="rc-trophy-name">100 Ck...</span>
                  <span className="rc-trophy-tier">Master</span>
                </div>
              </div>
            </div>

            {/* 3. Fleet Allies Card */}
            <div className="rc-dash-card rc-allies-card">
              <div className="rc-dash-card-header">
                <div className="rc-dash-card-title">
                  <Users size={16} className="rc-title-gold-icon" />
                  <span>Fleet Allies</span>
                </div>
                <span className="rc-allies-online-tag">14 Online • 68 Total</span>
              </div>

              <div className="rc-allies-list">
                {FLEET_ALLIES.map((ally) => (
                  <div key={ally.id} className="rc-ally-row">
                    <div className="rc-ally-avi-wrap">
                      <span className="rc-ally-avi">{ally.avatar}</span>
                      {ally.online && <span className="rc-ally-online-dot" />}
                    </div>

                    <div className="rc-ally-details">
                      <div className="rc-ally-name-rating">
                        <span className="rc-ally-name">{ally.name}</span>
                        <span className="rc-ally-rating">{ally.rating}</span>
                      </div>
                      <span className={`rc-ally-status-txt ${ally.online ? 'rc-online-status' : ''}`}>
                        {ally.status}
                      </span>
                    </div>

                    <div className="rc-ally-action-cell">
                      {ally.action === 'watch' && (
                        <button className="rc-btn-ally-action rc-btn-watch">
                          <Eye size={12} />
                          <span>Watch</span>
                        </button>
                      )}
                      {ally.action === 'duel' && (
                        <button className="rc-btn-ally-action rc-btn-duel-small">
                          <Swords size={12} />
                          <span>Duel</span>
                        </button>
                      )}
                      {ally.action === 'message' && (
                        <button className="rc-btn-ally-icon" title="Send message">
                          <MessageSquare size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rc-allies-footer">
                <button className="rc-btn-recruit-allies">
                  <span>+ Find &amp; Recruit Navigators</span>
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* ═══════════════ 5. PAGE FOOTER ═════════════════════════════════════ */}
      <footer className="rc-page-footer">
        <div className="rc-footer-left">
          <Crown size={14} className="rc-footer-icon" />
          <span>© 2024 Royal Chess. Strategy &amp; Classic. Master the Naval Arena.</span>
        </div>
        <div className="rc-footer-right">
          <span className="rc-footer-status">
            <span className="rc-footer-online-dot" /> Global Fleet Online
          </span>
          <span className="rc-footer-link">Fair Play Protocol</span>
          <span className="rc-footer-link">Terms of Service</span>
        </div>
      </footer>

      {/* ═══════════════ 6. HIGH SEAS RANKINGS MODAL ═══════════════════════ */}
      {showRankingsModal && (
        <div className="rc-modal-backdrop" onClick={() => setShowRankingsModal(false)}>
          <div className="rc-rankings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-header">
              <div className="rc-modal-title">
                <Trophy size={20} className="rc-title-gold-icon" />
                <h3>High Seas Global Rankings</h3>
              </div>
              <button
                className="rc-modal-close-btn"
                onClick={() => setShowRankingsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="rc-modal-body">
              <div className="rc-modal-table-header">
                <span>#</span>
                <span>Commander</span>
                <span>ELO</span>
                <span>W / L</span>
                <span>Win Rate</span>
                <span>Battles</span>
              </div>

              <div className="rc-modal-table-rows">
                {(leaderboard.length > 0 ? leaderboard : [
                  { id: 1, username: 'Admiral_Blackwood', nickname: 'Lord Blackwood', rating_elo: 2140, wins: 310, losses: 92, total_matches: 402, win_rate: 77.1 },
                  { id: 2, username: 'KrakenBane', nickname: 'KrakenBane', rating_elo: 2085, wins: 280, losses: 104, total_matches: 384, win_rate: 72.9 },
                  { id: 3, username: 'QueenAnne', nickname: 'Queen Anne', rating_elo: 1980, wins: 195, losses: 80, total_matches: 275, win_rate: 70.9 },
                  { id: 4, username: 'Prajwal', nickname: displayName, rating_elo: royaleElo, wins: wins, losses: losses, total_matches: totalBattles, win_rate: winRate },
                  { id: 5, username: 'Sea_Dog_Jack', nickname: 'Sea Dog Jack', rating_elo: 1720, wins: 160, losses: 98, total_matches: 258, win_rate: 62.0 },
                ]).map((item, idx) => {
                  const rank = idx + 1
                  const isMe = item.username === (user?.username || 'Prajwal')
                  return (
                    <div
                      key={item.id}
                      className={`rc-modal-row ${isMe ? 'rc-modal-row-me' : ''}`}
                    >
                      <div className="rc-modal-rank-col">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                      </div>
                      <div className="rc-modal-user-col">
                        <span className="rc-modal-user-name">
                          {item.nickname || item.username}
                          {isMe && <span className="rc-modal-you-tag">YOU</span>}
                        </span>
                        <span className="rc-modal-user-at">@{item.username}</span>
                      </div>
                      <div className="rc-modal-elo-col">{item.rating_elo}</div>
                      <div className="rc-modal-wl-col">
                        <span className="rc-wl-w">{item.wins}W</span> / <span className="rc-wl-l">{item.losses}L</span>
                      </div>
                      <div className="rc-modal-wr-col">{item.win_rate}%</div>
                      <div className="rc-modal-battles-col">{item.total_matches}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
