import type { FC } from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Trophy, LogOut, Crown, Shield,
  Calendar, Eye, Swords, UserPlus, MessageSquare,
  Clock, Flame, Users,
  CheckCircle2, Download, Search,
  Compass, Coins, User, UserCheck, UserX,
  X, Check, ExternalLink,
} from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { navigationStore, useNavigationStore } from '../../state/appNavigationStore'
import { api } from '../../api/client'
import type {
  UserProfileData,
  MatchData,
  PlayerSearchResult,
  FriendsListResponse,
} from '../../api/client'
import { audioEngine } from '../../audio/audioEngine'
import { getGuestDisplayName } from '../../utils/guestSession'

// ─── Default Reference Engagements ─────────────────────────────────────────

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

export const ProfilePage: FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { currentScreen, profileTab, viewingUsername } = useNavigationStore()

  // Viewing other player state
  const isViewingOther = Boolean(
    viewingUsername &&
    (!user || viewingUsername.toLowerCase() !== user.username.toLowerCase())
  )

  const [viewedProfile, setViewedProfile] = useState<UserProfileData | null>(null)
  const [isLoadingViewed, setIsLoadingViewed] = useState(false)
  const [viewedError, setViewedError] = useState<string | null>(null)

  // Friendship state with viewed player
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'friends' | 'pending_sent' | 'pending_received' | 'self'
  >('none')
  const [friendshipRequestId, setFriendshipRequestId] = useState<number | null>(null)
  const [friendActionMsg, setFriendActionMsg] = useState<string | null>(null)

  // Friends & Requests lists for logged-in user
  const [friendsData, setFriendsData] = useState<FriendsListResponse>({
    friends: [],
    received_requests: [],
    sent_requests: [],
  })
  const [alliesTab, setAlliesTab] = useState<'allies' | 'requests' | 'search'>('allies')

  // Player search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Matches and Leaderboard
  const [matchHistory, setMatchHistory] = useState<MatchData[]>([])
  const [leaderboard, setLeaderboard] = useState<UserProfileData[]>([])
  const [showRankingsModal, setShowRankingsModal] = useState(profileTab === 'leaderboard')
  const [activeHistoryFilter, setActiveHistoryFilter] = useState<'all' | 'royale' | 'classic' | 'tournaments'>('all')
  const [activeAnalyticsFilter, setActiveAnalyticsFilter] = useState<'30D' | '90D' | '1Y' | 'ALL'>('90D')
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  // 1. Fetch public profile if viewing another player's URL (e.g. royale-chess.com/pp)
  useEffect(() => {
    if (!viewingUsername || !isViewingOther) {
      setViewedProfile(null)
      setViewedError(null)
      return
    }

    setIsLoadingViewed(true)
    setViewedError(null)

    api.getPublicProfile(viewingUsername)
      .then((data) => {
        setViewedProfile(data)
        // Check friendship status with this user
        if (isAuthenticated) {
          api.getFriendshipStatus(viewingUsername)
            .then((res) => {
              setFriendshipStatus(res.status)
              setFriendshipRequestId(res.request_id ?? null)
            })
            .catch(() => setFriendshipStatus('none'))
        }
      })
      .catch((err) => {
        setViewedError(err.message || 'Player profile not found.')
      })
      .finally(() => {
        setIsLoadingViewed(false)
      })
  }, [viewingUsername, isViewingOther, isAuthenticated])

  // 2. Fetch friends list & requests for logged-in user
  const loadFriends = useCallback(() => {
    if (!isAuthenticated) return
    api.getFriends()
      .then(setFriendsData)
      .catch(() => {})
  }, [isAuthenticated])

  // Initial load
  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  // 2b. Real-time polling: check for new friend requests every 15 seconds
  useEffect(() => {
    if (!isAuthenticated) return
    const interval = setInterval(() => {
      api.getFriends()
        .then((freshData) => {
          setFriendsData((prev) => {
            // Check if there are new incoming requests
            const prevIds = new Set(prev.received_requests.map((r) => r.id))
            const newRequests = freshData.received_requests.filter((r) => !prevIds.has(r.id))
            if (newRequests.length > 0) {
              const names = newRequests.map((r) => r.sender_nickname || r.sender_username).join(', ')
              setFriendActionMsg(`📨 New friend request from ${names}!`)
              setTimeout(() => setFriendActionMsg(null), 6000)
            }
            return freshData
          })
        })
        .catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  // 3. Search for players
  const handleSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    api.searchPlayers(trimmed)
      .then(setSearchResults)
      .catch(() => setSearchResults([]))
      .finally(() => setIsSearching(false))
  }, [])

  // 4. Send friend request
  const handleSendFriendRequest = async (targetUsername: string) => {
    audioEngine.playButtonClick()
    if (!isAuthenticated) {
      authStore.openAuthModal()
      return
    }
    try {
      const res = await api.sendFriendRequest(targetUsername)
      setFriendActionMsg(res.message || 'Friend request sent!')
      setFriendshipStatus('pending_sent')
      loadFriends()
      setTimeout(() => setFriendActionMsg(null), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send request'
      setFriendActionMsg(msg)
      setTimeout(() => setFriendActionMsg(null), 4000)
    }
  }

  // 5. Respond to friend request (accept/reject)
  const handleRespondRequest = async (requestId: number, action: 'accept' | 'reject') => {
    audioEngine.playButtonClick()
    try {
      await api.respondFriendRequest(requestId, action)
      setFriendActionMsg(action === 'accept' ? 'Friend request accepted!' : 'Request declined.')
      loadFriends()
      if (viewingUsername) {
        api.getFriendshipStatus(viewingUsername).then((res) => {
          setFriendshipStatus(res.status)
        })
      }
      setTimeout(() => setFriendActionMsg(null), 4000)
    } catch {
      // ignore
    }
  }

  // 6. Fetch rankings & match history
  const fetchRankings = useCallback(() => {
    api.getLeaderboard(20)
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
  }, [])

  useEffect(() => {
    if (profileTab === 'leaderboard') {
      fetchRankings()
      setShowRankingsModal(true)
    } else {
      setShowRankingsModal(false)
    }
  }, [profileTab, fetchRankings])

  useEffect(() => {
    if (currentScreen !== 'profile') return
    if (isAuthenticated) {
      api.getMatchHistory()
        .then((data) => setMatchHistory(data.filter((m) => m.status === 'completed').slice(0, 15)))
        .catch(() => setMatchHistory([]))
    }
  }, [currentScreen, isAuthenticated])

  if (currentScreen !== 'profile') return null

  // Determine which profile data to display
  const activeProfile = isViewingOther ? viewedProfile : user

  const displayName = isViewingOther
    ? (viewedProfile?.nickname || viewedProfile?.username || viewingUsername)
    : (user ? (user.nickname || user.username) : getGuestDisplayName())

  const normalElo = activeProfile?.normal_rating ?? 0
  const royaleElo = activeProfile?.royale_rating ?? 0
  const totalBattles = activeProfile?.total_matches ?? 0
  const wins = activeProfile?.wins ?? 0
  const draws = activeProfile?.draws ?? 0
  const losses = activeProfile?.losses ?? 0
  const winRate = activeProfile?.win_rate ?? 0
  const joinedDate = activeProfile?.created_at
    ? new Date(activeProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'
  const rankGlobal = activeProfile?.global_rank ? `#${activeProfile.global_rank}` : '—'

  // Win, Draw, Loss percentages
  const wPct = totalBattles > 0 ? Math.round((wins / totalBattles) * 100) : 0
  const dPct = totalBattles > 0 ? Math.round((draws / totalBattles) * 100) : 0
  const lPct = totalBattles > 0 ? Math.max(0, 100 - wPct - dPct) : 0

  const handleLogout = async () => {
    audioEngine.playButtonClick()
    await authStore.logout()
  }

  // Convert real matches to engagement items if available
  const displayEngagements: EngagementItem[] = !isViewingOther
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
    : DEFAULT_ENGAGEMENTS.slice(0, 0)

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
              navigationStore.openProfilePage('leaderboard')
            }}
          >
            <Trophy size={14} />
            <span className="rankings-label">Rankings</span>
          </button>

          {/* Profile / Auth Pill */}
          {isAuthenticated && user ? (
            <div
              className={`nav-profile-pill ${!isViewingOther ? 'active-nav-pill' : ''}`}
              onClick={() => navigationStore.openProfilePage('overview')}
              title="View my profile"
              style={{ cursor: 'pointer' }}
            >
              <div className="nav-avatar">🏴‍☠️</div>
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
                onClick={() => navigationStore.openProfilePage('overview')}
                title="View Guest Session"
                style={{ cursor: 'pointer' }}
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

        {/* Action notification banner (e.g. friend request sent) */}
        {friendActionMsg && (
          <div className="rc-toast-banner">
            <CheckCircle2 size={16} />
            <span>{friendActionMsg}</span>
          </div>
        )}

        {/* If viewing another player: header tag showing it's a public dossier */}
        {isViewingOther && (
          <div className="rc-viewing-header-bar">
            <div className="rc-vh-info">
              <Eye size={15} />
              <span>Viewing <strong>@{viewingUsername}</strong>'s profile</span>
            </div>
            {isAuthenticated && (
              <button
                className="rc-btn-return-my-profile"
                onClick={() => navigationStore.openProfilePage('overview')}
              >
                ← Back to My Profile
              </button>
            )}
          </div>
        )}

        {/* Loading state when fetching other user */}
        {isLoadingViewed ? (
          <div className="rc-viewed-loading-card">
            <div className="rc-viewed-spinner" />
            <span>Retrieving naval records for @{viewingUsername}...</span>
          </div>
        ) : viewedError ? (
          <div className="rc-viewed-error-card">
            <Compass size={36} className="rc-error-compass-icon" />
            <h3>Player Not Found</h3>
            <p>No profile was found for "<strong>{viewingUsername}</strong>".</p>
            <div className="rc-error-actions">
              <button
                className="rc-btn-duel"
                onClick={() => navigationStore.returnToLanding()}
              >
                Return to Lobby
              </button>
              {isAuthenticated && (
                <button
                  className="rc-btn-secondary"
                  onClick={() => navigationStore.openProfilePage('overview')}
                >
                  My Profile
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* ════════════ 2. HERO PROFILE HEADER ════════════════════════════ */}
            <section className="rc-hero-card">
              {/* Status badges top-right */}
              <div className="rc-hero-status-row">
                <span className="rc-status-pill rc-status-online">
                  <span className="rc-online-dot" /> Online now
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


                  <p className="rc-hero-motto">
                    Chess player • Enjoys Royale and classic chess.
                  </p>

                  <div className="rc-hero-meta-row">
                    <span className="rc-hero-meta-item">
                      <Calendar size={13} /> Joined {joinedDate}
                    </span>
                    <span className="rc-hero-meta-item">
                      <Eye size={13} /> 12.4k Views
                    </span>
                    <span className="rc-hero-meta-item rc-meta-gold">
                      <Trophy size={13} /> Rank {rankGlobal} Global
                    </span>
                  </div>
                </div>

                {/* Action Buttons Column */}
                <div className="rc-hero-actions-section">
                  <div className="rc-hero-cta-buttons">
                    <button
                      className="rc-btn-duel"
                      onClick={() => navigationStore.returnToLanding()}
                      title={`Challenge ${displayName} to a match`}
                    >
                      <Swords size={16} />
                      <span>Challenge to Duel</span>
                    </button>

                    {/* Friend button: changes dynamically when looking at other users */}
                    {isViewingOther && viewingUsername && (
                      <>
                        {friendshipStatus === 'none' && (
                          <button
                            className="rc-btn-secondary rc-btn-add-friend"
                            onClick={() => handleSendFriendRequest(viewingUsername)}
                            title="Send friend request"
                          >
                            <UserPlus size={15} />
                            <span>Add Friend</span>
                          </button>
                        )}
                        {friendshipStatus === 'pending_sent' && (
                          <button className="rc-btn-secondary rc-btn-pending" disabled>
                            <Clock size={15} />
                            <span>Request Sent</span>
                          </button>
                        )}
                        {friendshipStatus === 'pending_received' && friendshipRequestId && (
                          <button
                            className="rc-btn-secondary rc-btn-accept"
                            onClick={() => handleRespondRequest(friendshipRequestId, 'accept')}
                            title="Accept friend request"
                          >
                            <UserCheck size={15} />
                            <span>Accept Request</span>
                          </button>
                        )}
                        {friendshipStatus === 'friends' && (
                          <button className="rc-btn-secondary rc-btn-allies" disabled>
                            <Users size={15} />
                            <span>Allies</span>
                          </button>
                        )}
                      </>
                    )}

                    {!isViewingOther && (
                      <button
                        className="rc-btn-secondary"
                        onClick={() => {
                          setAlliesTab('search')
                          const searchBox = document.getElementById('commander-search-box')
                          searchBox?.focus()
                        }}
                      >
                        <UserPlus size={15} />
                        <span>Find Allies</span>
                      </button>
                    )}

                    <button className="rc-btn-secondary">
                      <MessageSquare size={15} />
                      <span>Message</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ════════════ 3. FOUR MODE STAT CARDS ═══════════════════════════ */}
            <section className="rc-modes-grid">
              {/* Card 1: Royale */}
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
                  <span className="rc-footer-winrate">Winrate: <strong>{winRate}%</strong></span>
                  <span className="rc-footer-wdl">{wins}W • {losses}L • {draws}D</span>
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

            </section>

            {/* ════════════ 4. TWO-COLUMN DASHBOARD SECTION ═══════════════════ */}
            <section className="rc-dashboard-grid">

              {/* ────── LEFT COLUMN (ANALYTICS & ENGAGEMENTS) ────── */}
              <div className="rc-dash-col-left">

                {/* Rating statistics */}
                <div className="rc-dash-card rc-analytics-card">
                  <div className="rc-dash-card-header">
                    <div className="rc-dash-card-title">
                      <Compass size={17} className="rc-title-gold-icon" />
                      <span>Rating Statistics</span>
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

                {/* Overall match record */}
                  <div className="rc-record-summary-box">
                    <div className="rc-record-header">
                    <span className="rc-record-title">Match Record ({totalBattles} matches)</span>
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

                {/* Player statistics */}
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

                {/* Recent matches */}
                <div className="rc-dash-card rc-engagements-card">
                  <div className="rc-dash-card-header">
                    <div className="rc-dash-card-title">
                      <Swords size={17} className="rc-title-gold-icon" />
                      <span>Recent Matches</span>
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

                  {/* Match history link */}
                  <div className="rc-engagements-footer">
                    <button
                      className="rc-view-logbook-btn"
                      onClick={() => {
                        fetchRankings()
                        navigationStore.openProfilePage('leaderboard')
                      }}
                    >
                      View Match History ({totalBattles} matches) &gt;
                    </button>
                  </div>
                </div>
              </div>

              {/* ────── RIGHT COLUMN (PLAYER SEARCH & ALLIES, TROPHIES) ────── */}
              <div className="rc-dash-col-right">

                {/* Player search and friend requests */}
                <div className="rc-dash-card rc-allies-manager-card">
                  <div className="rc-dash-card-header">
                    <div className="rc-dash-card-title">
                      <Users size={16} className="rc-title-gold-icon" />
                      <span>Players and Friends</span>
                    </div>

                    {/* Allies / Requests / Search Tab Switcher */}
                    <div className="rc-allies-tab-switcher">
                      <button
                        className={`rc-atab-btn ${alliesTab === 'allies' ? 'active' : ''}`}
                        onClick={() => setAlliesTab('allies')}
                      >
                        Allies ({friendsData.friends.length})
                      </button>
                      <button
                        className={`rc-atab-btn ${alliesTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setAlliesTab('requests')}
                      >
                        Requests
                        {friendsData.received_requests.length > 0 && (
                          <span className="rc-req-badge">{friendsData.received_requests.length}</span>
                        )}
                      </button>
                      <button
                        className={`rc-atab-btn ${alliesTab === 'search' ? 'active' : ''}`}
                        onClick={() => setAlliesTab('search')}
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  {/* ── Tab: Search Players ── */}
                  {alliesTab === 'search' && (
                    <div className="rc-search-tab-content">
                      <div className="rc-search-input-wrap">
                        <Search size={14} className="rc-search-input-icon" />
                        <input
                          id="commander-search-box"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            handleSearch(e.target.value)
                          }}
                          placeholder="Search commander by username (e.g. pp)..."
                          className="rc-search-input"
                        />
                        {searchQuery && (
                          <button
                            className="rc-search-clear"
                            onClick={() => {
                              setSearchQuery('')
                              setSearchResults([])
                            }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {isSearching ? (
                        <div className="rc-search-searching">
                          <div className="rc-search-spinner" />
                          <span>Searching naval roster...</span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="rc-search-results-list">
                          {searchResults.map((p) => {
                            const isMe = user && p.username.toLowerCase() === user.username.toLowerCase()
                            return (
                              <div key={p.id} className="rc-search-result-row">
                                <div className="rc-sr-user-info">
                                  <span className="rc-sr-avatar">⚓</span>
                                  <div>
                                    <div className="rc-sr-name-row">
                                      <span className="rc-sr-name">{p.nickname || p.username}</span>
                                      <span className="rc-sr-at">@{p.username}</span>
                                      {isMe && <span className="rc-sr-me-tag">YOU</span>}
                                    </div>
                                    <span className="rc-sr-elo">{p.royale_rating || p.normal_rating} ELO • {p.win_rate}% Winrate</span>
                                  </div>
                                </div>

                                <div className="rc-sr-actions">
                                  <button
                                    className="rc-btn-sr-view"
                                    onClick={() => navigationStore.openUserProfile(p.username)}
                                    title="View player profile"
                                  >
                                    <ExternalLink size={12} />
                                    <span>Profile</span>
                                  </button>
                                  {!isMe && (
                                    <button
                                      className="rc-btn-sr-add"
                                      onClick={() => handleSendFriendRequest(p.username)}
                                      title="Send Friend Request"
                                    >
                                      <UserPlus size={12} />
                                      <span>Add</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : searchQuery.trim() ? (
                        <div className="rc-search-empty">
                          <Compass size={24} />
                          <span>No commanders found matching "{searchQuery}".</span>
                        </div>
                      ) : (
                        <div className="rc-search-hint">
                          <span>Type any commander's username or URL like <strong>/pp</strong> to view their dossier.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Tab: Pending Requests ── */}
                  {alliesTab === 'requests' && (
                    <div className="rc-requests-tab-content">
                      <span className="rc-req-section-lbl">INCOMING REQUESTS</span>
                      {friendsData.received_requests.length === 0 ? (
                        <div className="rc-empty-requests-msg">
                          <span>No pending friend requests received.</span>
                        </div>
                      ) : (
                        <div className="rc-requests-list">
                          {friendsData.received_requests.map((req) => (
                            <div key={req.id} className="rc-req-item-row">
                              <div className="rc-req-user-meta">
                                <span className="rc-req-avi">🏴‍☠️</span>
                                <div>
                                  <span className="rc-req-name">{req.sender_nickname || req.sender_username}</span>
                                  <span className="rc-req-sub">@{req.sender_username} • {req.sender_rating} ELO</span>
                                </div>
                              </div>

                              <div className="rc-req-btn-group">
                                <button
                                  className="rc-btn-accept-pill"
                                  onClick={() => handleRespondRequest(req.id, 'accept')}
                                  title="Accept Friend Request"
                                >
                                  <Check size={12} />
                                  <span>Accept</span>
                                </button>
                                <button
                                  className="rc-btn-decline-pill"
                                  onClick={() => handleRespondRequest(req.id, 'reject')}
                                  title="Decline"
                                >
                                  <UserX size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {friendsData.sent_requests.length > 0 && (
                        <>
                          <span className="rc-req-section-lbl" style={{ marginTop: 12 }}>OUTGOING PENDING REQUESTS</span>
                          <div className="rc-requests-list">
                            {friendsData.sent_requests.map((req) => (
                              <div key={req.id} className="rc-req-item-row rc-req-sent">
                                <div className="rc-req-user-meta">
                                  <span className="rc-req-avi">⚓</span>
                                  <div>
                                    <span className="rc-req-name">{req.receiver_nickname || req.receiver_username}</span>
                                    <span className="rc-req-sub">@{req.receiver_username} • Pending...</span>
                                  </div>
                                </div>
                                <span className="rc-req-waiting-tag">Sent</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Tab: Accepted Allies (Friends) ── */}
                  {alliesTab === 'allies' && (
                    <div className="rc-allies-tab-content">
                      {friendsData.friends.length > 0 ? (
                        <div className="rc-allies-list">
                          {friendsData.friends.map((friend) => (
                            <div key={friend.id} className="rc-ally-row">
                              <div className="rc-ally-avi-wrap">
                                <span className="rc-ally-avi">👨‍✈️</span>
                                <span className="rc-ally-online-dot" />
                              </div>

                              <div className="rc-ally-details">
                                <div className="rc-ally-name-rating">
                                  <span className="rc-ally-name">{friend.nickname || friend.username}</span>
                                  <span className="rc-ally-rating">{friend.royale_rating || friend.normal_rating} ELO</span>
                                </div>
                                <span className="rc-ally-status-txt rc-online-status">
                                  Online and available
                                </span>
                              </div>

                              <div className="rc-ally-action-cell">
                                <button
                                  className="rc-btn-ally-action rc-btn-duel-small"
                                  onClick={() => navigationStore.openUserProfile(friend.username)}
                                  title="View Profile"
                                >
                                  <ExternalLink size={11} />
                                  <span>Profile</span>
                                </button>
                                <button
                                  className="rc-btn-ally-action rc-btn-watch"
                                  onClick={() => navigationStore.returnToLanding()}
                                  title="Challenge to Duel"
                                >
                                  <Swords size={11} />
                                  <span>Duel</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rc-allies-empty-box">
                          <Users size={28} className="rc-allies-empty-icon" />
                          <p>You have no friends yet. Search for players or share your profile link (for example, <strong>/{user?.username || 'username'}</strong>).</p>
                          <button
                            className="rc-btn-sr-add"
                            onClick={() => setAlliesTab('search')}
                            style={{ margin: '8px auto 0' }}
                          >
                            <Search size={13} />
                            <span>Search Players</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                

              </div>
            </section>
          </>
        )}

      </main>

      {/* ═══════════════ 5. PAGE FOOTER ═════════════════════════════════════ */}
      <footer className="rc-page-footer">
        <div className="rc-footer-left">
          <Crown size={14} className="rc-footer-icon" />
          <span>© 2024 Royal Chess. Classic chess and Royale mode.</span>
        </div>
        <div className="rc-footer-right">
          <span className="rc-footer-status">
            <span className="rc-footer-online-dot" /> Players online
          </span>
          <span className="rc-footer-link">Fair Play</span>
          <span className="rc-footer-link">Terms of Service</span>
        </div>
      </footer>

      {/* ═══════════════ 6. HIGH SEAS RANKINGS MODAL ═══════════════════════ */}
      {showRankingsModal && (
        <div
          className="rc-modal-backdrop"
          onClick={() => {
            setShowRankingsModal(false)
            navigationStore.openProfilePage('overview')
          }}
        >
          <div className="rc-rankings-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="rc-modal-header">
              <div className="rc-modal-title">
                <Trophy size={20} className="rc-title-gold-icon" />
                <h3>Global Rankings</h3>
              </div>
              <button
                className="rc-modal-close-btn"
                onClick={() => {
                  setShowRankingsModal(false)
                  navigationStore.openProfilePage('overview')
                }}
              >
                ✕
              </button>
            </div>

            <div className="rc-modal-body">
              <div className="rc-modal-table-header">
                <span>#</span>
                <span>Player</span>
                <span>ELO</span>
                <span>W / L</span>
                <span>Win Rate</span>
                <span>Matches</span>
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
                        <span
                          className="rc-modal-user-name"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShowRankingsModal(false)
                            navigationStore.openUserProfile(item.username)
                          }}
                          title={`View @${item.username}'s profile`}
                        >
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
