import type { FC } from 'react'
import { useState, useEffect, useRef } from 'react'
import {
  Crown, Trophy, Coins, Bell,
  User, Palette, Volume2, Timer, Shield, Check, CheckCircle2,
  Upload, ChevronDown, ArrowLeft
} from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { navigationStore, useNavigationStore } from '../../state/appNavigationStore'
import { audioSettingsStore, useAudioSettings } from '../../audio/audioSettingsStore'
import { audioEngine } from '../../audio/audioEngine'
import { api } from '../../api/client'

type SettingsTab = 'profile' | 'theme' | 'audio' | 'gameplay' | 'account' | 'notifications'

interface PortraitOption {
  id: string
  title: string
  image: string
}

const UNLOCKED_PORTRAITS: PortraitOption[] = [
  { id: 'grand_admiral', title: 'Royal King', image: '/admiral-avatar.png' },
  { id: 'corsair', title: 'Knight Champion', image: '/admiral-avatar.png' },
  { id: 'sovereign', title: 'Grand Queen', image: '/admiral-avatar.png' },
  { id: 'navigator', title: 'Royal Bishop', image: '/admiral-avatar.png' },
]

const BOARD_THEMES = [
  { id: 'sunken_galleon', name: 'Classic Wood', desc: 'Polished Wood & Gold', light: '#d4a373', dark: '#582f0e' },
  { id: 'ocean_obsidian', name: 'Ocean Obsidian', desc: 'Dark Teal & Gold', light: '#0077b6', dark: '#03045e' },
  { id: 'mahogany_fleet', name: 'Mahogany Classic', desc: 'Warm Varnished Deck', light: '#b08968', dark: '#3e2723' },
  { id: 'royal_marble', name: 'Royal Marble', desc: 'Ceremonial Ivory & Slate', light: '#f8f9fa', dark: '#343a40' },
]

export const SettingsPage: FC = () => {
  const { user, isAuthenticated } = useAuthStore()
  const { settingsTab = 'profile' } = useNavigationStore()
  const activeTab = settingsTab
  const audioSettings = useAudioSettings()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [selectedPortrait, setSelectedPortrait] = useState('grand_admiral')
  const [avatarImage, setAvatarImage] = useState<string>(() => {
    return user?.avatar || localStorage.getItem('rc_user_avatar') || '/admiral-avatar.png'
  })
  const [displayName, setDisplayName] = useState(user?.nickname || user?.username || 'Prajwal')
  const [honorificTitle, setHonorificTitle] = useState('Grandmaster II')
  const [playerBio, setPlayerBio] = useState(
    'Chess tactician • Royale Mode enthusiast • Playing tactical chess games.'
  )
  const [homeFlag, setHomeFlag] = useState('IN India')
  const [flagshipSkin] = useState('Golden Crown Crest')
  const [discordTag, setDiscordTag] = useState('Prajwal#9941')
  const [twitchUrl, setTwitchUrl] = useState('twitch.tv/prajwal_chess')
  const [twitterHandle, setTwitterHandle] = useState('@PrajwalNaval')

  // Theme states
  const [boardTheme, setBoardTheme] = useState('sunken_galleon')
  const [pieceCarving, setPieceCarving] = useState('nautical')
  const [uiHue, setUiHue] = useState('gold')
  const [contrastDepth, setContrastDepth] = useState(92)

  // Audio states
  const [masterVol, setMasterVol] = useState(Math.round(audioSettings.masterVolume * 100))
  const [ambientVol, setAmbientVol] = useState(Math.round(audioSettings.ambientVolume * 100))
  const [sfxVol, setSfxVol] = useState(Math.round(audioSettings.sfxVolume * 100))
  const [sfxLibrary, setSfxLibrary] = useState('classic_wood')
  const [checkAlarm, setCheckAlarm] = useState(true)
  const [lowClockChime, setLowClockChime] = useState(true)

  // Gameplay states
  const [autoQueen, setAutoQueen] = useState(false)
  const [preMoves, setPreMoves] = useState(true)
  const [highlightLegal, setHighlightLegal] = useState(true)
  const [clickConfirmation, setClickConfirmation] = useState(false)

  // Account states
  const [steamLinked, setSteamLinked] = useState(true)
  const [discordLinked, setDiscordLinked] = useState(true)
  const [googleLinked, setGoogleLinked] = useState(false)

  // Notifications states
  const [notifFriendReq, setNotifFriendReq] = useState(true)
  const [notifMatchInvite, setNotifMatchInvite] = useState(true)
  const [notifSound, setNotifSound] = useState(true)

  // Feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Trigger file selection for profile picture upload
  const handleTriggerUpload = () => {
    fileInputRef.current?.click()
  }

  // Handle image upload and client-side resize
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 4 * 1024 * 1024) {
      setToastMsg('Image exceeds 4MB limit.')
      setTimeout(() => setToastMsg(null), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width)
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height)
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
          setAvatarImage(compressedDataUrl)
          setSelectedPortrait('custom')
          setToastMsg('Custom profile picture uploaded! Click Save to apply.')
          setTimeout(() => setToastMsg(null), 3500)
        }
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleSelectPortrait = (p: PortraitOption) => {
    audioEngine.playButtonClick()
    setSelectedPortrait(p.id)
    setAvatarImage(p.image)
  }

  // Load persisted values on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rc_user_settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.boardTheme) setBoardTheme(parsed.boardTheme)
        if (parsed.pieceCarving) setPieceCarving(parsed.pieceCarving)
        if (parsed.uiHue) setUiHue(parsed.uiHue)
        if (parsed.contrastDepth !== undefined) setContrastDepth(parsed.contrastDepth)
        if (parsed.sfxVol !== undefined) setSfxVol(parsed.sfxVol)
        if (parsed.autoQueen !== undefined) setAutoQueen(parsed.autoQueen)
        if (parsed.preMoves !== undefined) setPreMoves(parsed.preMoves)
        if (parsed.highlightLegal !== undefined) setHighlightLegal(parsed.highlightLegal)
        if (parsed.clickConfirmation !== undefined) setClickConfirmation(parsed.clickConfirmation)
        if (parsed.checkAlarm !== undefined) setCheckAlarm(parsed.checkAlarm)
        if (parsed.lowClockChime !== undefined) setLowClockChime(parsed.lowClockChime)
      }
    } catch {
      // ignore
    }
  }, [])

  // Handle saving changes
  const handleSaveChanges = async () => {
    audioEngine.playButtonClick()
    const settingsPayload = {
      selectedPortrait,
      avatarImage,
      displayName,
      honorificTitle,
      playerBio,
      homeFlag,
      flagshipSkin,
      discordTag,
      twitchUrl,
      twitterHandle,
      boardTheme,
      pieceCarving,
      uiHue,
      contrastDepth,
      masterVol,
      ambientVol,
      sfxVol,
      sfxLibrary,
      checkAlarm,
      lowClockChime,
      autoQueen,
      preMoves,
      highlightLegal,
      clickConfirmation,
      notifFriendReq,
      notifMatchInvite,
      notifSound,
    }

    try {
      localStorage.setItem('rc_user_settings', JSON.stringify(settingsPayload))
      localStorage.setItem('rc_user_avatar', avatarImage)

      audioSettingsStore.setVolume(masterVol / 100)
      audioSettingsStore.setAmbientVolume(ambientVol / 100)
      audioSettingsStore.setSfxVolume(sfxVol / 100)

      if (isAuthenticated && user) {
        await api.updateProfile({
          nickname: displayName.trim(),
          avatar: avatarImage,
        }).catch(() => {})

        authStore.updateUser({
          ...user,
          nickname: displayName.trim(),
          avatar: avatarImage,
        })
      }

      setToastMsg('Settings saved successfully!')
      setTimeout(() => setToastMsg(null), 3500)
    } catch {
      setToastMsg('Failed to save settings.')
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  // Handle discarding changes
  const handleDiscard = () => {
    audioEngine.playButtonClick()
    setDisplayName(user?.nickname || user?.username || 'Prajwal')
    setAvatarImage(user?.avatar || localStorage.getItem('rc_user_avatar') || '/admiral-avatar.png')
    setMasterVol(Math.round(audioSettings.masterVolume * 100))
    setAmbientVol(Math.round(audioSettings.ambientVolume * 100))
    setSfxVol(Math.round(audioSettings.sfxVolume * 100))
    setToastMsg('Changes reverted.')
    setTimeout(() => setToastMsg(null), 2500)
  }

  const handleTabChange = (tab: SettingsTab) => {
    audioEngine.playButtonClick()
    navigationStore.openSettingsPage(tab)
  }

  const coins = user?.persistent_coins ?? (isAuthenticated ? 100 : 4280)

  return (
    <div className="rc-settings-screen">
      {/* ═══════════════ TOP HEADER ═══════════════ */}
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
            className="nav-item nav-item-settings active-gold-pill"
            onClick={() => navigationStore.openSettingsPage(activeTab)}
          >
            Settings
          </button>

          {/* User Status / Auth Pill */}
          {isAuthenticated && user ? (
            <div
              className="nav-profile-pill"
              onClick={() => navigationStore.openProfilePage('overview')}
              title="View Profile"
              style={{ cursor: 'pointer' }}
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
              <div className="nav-coins-badge">
                <Coins size={13} className="rc-coin-icon" />
                <span>{coins.toLocaleString()} GOLD</span>
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

          <button
            className="btn-nav-lobby"
            onClick={() => navigationStore.returnToLanding()}
            title="Return to Main Menu"
          >
            <ArrowLeft size={14} />
            <span>Lobby</span>
          </button>
        </nav>
      </header>

      {/* ═══════════════ SUB-HEADER BAR ═══════════════ */}
      <div className="rc-settings-subbar">
        <div className="rc-subbar-titles">
          <span className="rc-subbar-tag">PLAYER SETTINGS</span>
          <h2 className="rc-subbar-heading">Account Settings</h2>
        </div>
        <div className="rc-subbar-actions">
          <button className="rc-btn-discard" onClick={handleDiscard}>
            Discard
          </button>
          <button className="rc-btn-save-gold" onClick={handleSaveChanges}>
            <Check size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Action Toast */}
      {toastMsg && (
        <div className="rc-toast-banner" style={{ margin: '12px auto', maxWidth: 1180 }}>
          <CheckCircle2 size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════ MAIN TWO-COLUMN BODY ═══════════════ */}
      <main className="rc-settings-main-wrap">
        <div className="rc-settings-grid">

          {/* ────── LEFT SIDEBAR NAVIGATION ────── */}
          <aside className="rc-settings-sidebar">
            <nav className="rc-settings-nav-list">
              <button
                className={`rc-snav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <div className="rc-snav-left">
                  <User size={16} />
                  <span>Profile &amp; Identity</span>
                </div>
                {activeTab === 'profile' && <span className="rc-snav-dot-gold" />}
              </button>

              <button
                className={`rc-snav-btn ${activeTab === 'theme' ? 'active' : ''}`}
                onClick={() => handleTabChange('theme')}
              >
                <div className="rc-snav-left">
                  <Palette size={16} />
                  <span>Theme &amp; Board</span>
                </div>
                <span className="rc-snav-badge-pill">4 New</span>
              </button>

              <button
                className={`rc-snav-btn ${activeTab === 'audio' ? 'active' : ''}`}
                onClick={() => handleTabChange('audio')}
              >
                <div className="rc-snav-left">
                  <Volume2 size={16} />
                  <span>Audio &amp; Sound FX</span>
                </div>
              </button>

              <button
                className={`rc-snav-btn ${activeTab === 'gameplay' ? 'active' : ''}`}
                onClick={() => handleTabChange('gameplay')}
              >
                <div className="rc-snav-left">
                  <Timer size={16} />
                  <span>Gameplay &amp; Clocks</span>
                </div>
              </button>

              <button
                className={`rc-snav-btn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => handleTabChange('account')}
              >
                <div className="rc-snav-left">
                  <Shield size={16} />
                  <span>Account &amp; Security</span>
                </div>
                <span className="rc-snav-dot-green" />
              </button>

              <button
                className={`rc-snav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <div className="rc-snav-left">
                  <Bell size={16} />
                  <span>Notifications</span>
                </div>
              </button>
            </nav>

            {/* Bottom Rank Card */}
            <div className="rc-armory-rank-box">
              <div className="rc-arb-header">
                <span className="rc-arb-title">RATING &amp; RANK</span>
                <Trophy size={14} className="rc-arb-icon" />
              </div>

              <div className="rc-arb-rank-row">
                <div className="rc-arb-rank-icon">♛</div>
                <div>
                  <h4 className="rc-arb-rank-name">Grand Master II</h4>
                  <span className="rc-arb-rank-sub">ELO: 1,940 • Top 1.2%</span>
                </div>
              </div>

              <div className="rc-arb-progress-track">
                <div className="rc-arb-progress-fill" style={{ width: '74%' }} />
              </div>
              <span className="rc-arb-tier-next">60 ELO to reach next tier</span>
            </div>
          </aside>

          {/* ────── RIGHT CONTENT PANEL ────── */}
          <section className="rc-settings-content">

            {/* ════ TAB 1: PROFILE & IDENTITY ════ */}
            {activeTab === 'profile' && (
              <div className="rc-settings-tab-pane">

                {/* Card 1: Avatar & Regalia */}
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Profile Picture &amp; Avatar</h3>
                  <p className="rc-pane-sub">
                    Choose a preset portrait or upload your own profile picture.
                  </p>

                  <div className="rc-avatar-config-row">
                    {/* Active preview */}
                    <div className="rc-active-avatar-wrap">
                      <img src={avatarImage} alt="Profile" className="rc-active-avi-img" />
                      <span className="rc-avi-active-tag">ACTIVE</span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png, image/jpeg, image/webp"
                      style={{ display: 'none' }}
                      onChange={handleAvatarFileUpload}
                    />

                    <div className="rc-avi-config-controls">
                      <div className="rc-avi-btn-row">
                        <button className="rc-btn-gold-pill" onClick={handleTriggerUpload}>
                          <Crown size={14} />
                          <span>Change Portrait</span>
                        </button>
                        <button className="rc-btn-outline-pill" onClick={handleTriggerUpload}>
                          <Upload size={14} />
                          <span>Upload Custom</span>
                        </button>
                        <span className="rc-avi-limit-txt">Max 4MB (PNG, JPG, WEBP)</span>
                      </div>

                      <span className="rc-avi-section-lbl">PRESET PORTRAITS</span>
                      <div className="rc-portraits-grid">
                        {UNLOCKED_PORTRAITS.map((p) => (
                          <div
                            key={p.id}
                            className={`rc-portrait-thumb-card ${selectedPortrait === p.id ? 'selected' : ''}`}
                            onClick={() => handleSelectPortrait(p)}
                          >
                            <img src={p.image} alt={p.title} className="rc-portrait-thumb-img" />
                            <span className="rc-portrait-thumb-label">{p.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Captains Identity & Credentials */}
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Profile &amp; Identity</h3>

                  <div className="rc-fields-two-col">
                    <div className="rc-field-group">
                      <label className="rc-field-label">DISPLAY NAME</label>
                      <div className="rc-input-with-icon">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="rc-pane-input"
                        />
                        <CheckCircle2 size={15} className="rc-input-check-icon" />
                      </div>
                      <span className="rc-field-hint">Visible in global lobbies and leaderboards.</span>
                    </div>

                    <div className="rc-field-group">
                      <label className="rc-field-label">TITLE</label>
                      <div className="rc-select-wrap">
                        <select
                          value={honorificTitle}
                          onChange={(e) => setHonorificTitle(e.target.value)}
                          className="rc-pane-select"
                        >
                          <option>Grandmaster II</option>
                          <option>Grandmaster</option>
                          <option>Master</option>
                          <option>Candidate Master</option>
                          <option>Expert</option>
                        </select>
                        <ChevronDown size={14} className="rc-select-chevron" />
                      </div>
                      <span className="rc-field-hint">Unlocked by winning tournament matches.</span>
                    </div>
                  </div>

                  {/* Player Bio */}
                  <div className="rc-field-group" style={{ marginTop: 14 }}>
                    <div className="rc-label-with-count">
                      <label className="rc-field-label">PLAYER BIO</label>
                      <span className="rc-char-counter">{playerBio.length} / 240 chars</span>
                    </div>
                    <textarea
                      value={playerBio}
                      onChange={(e) => setPlayerBio(e.target.value.slice(0, 240))}
                      rows={3}
                      className="rc-pane-textarea"
                    />
                  </div>

                  <div className="rc-fields-two-col" style={{ marginTop: 14 }}>
                    <div className="rc-field-group">
                      <label className="rc-field-label">COUNTRY / REGION</label>
                      <div className="rc-select-wrap">
                        <select
                          value={homeFlag}
                          onChange={(e) => setHomeFlag(e.target.value)}
                          className="rc-pane-select"
                        >
                          <option>IN India</option>
                          <option>US United States</option>
                          <option>GB United Kingdom</option>
                          <option>JP Japan</option>
                        </select>
                        <ChevronDown size={14} className="rc-select-chevron" />
                      </div>
                    </div>

                    <div className="rc-field-group">
                      <label className="rc-field-label">PROFILE BANNER SKIN</label>
                      <div className="rc-banner-skin-box">
                        <div className="rc-bs-left">
                          <span className="rc-bs-dot-gold" />
                          <span className="rc-bs-name">{flagshipSkin}</span>
                        </div>
                        <div className="rc-bs-right">
                          <span className="rc-bs-equipped-tag">EQUIPPED</span>
                          <button className="rc-btn-browse-skin">Browse</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="rc-field-group" style={{ marginTop: 14 }}>
                    <label className="rc-field-label">SOCIAL LINKS</label>
                    <div className="rc-socials-grid">
                      <div className="rc-social-input-wrap">
                        <span className="rc-social-prefix">👾</span>
                        <input
                          type="text"
                          value={discordTag}
                          onChange={(e) => setDiscordTag(e.target.value)}
                          className="rc-social-input"
                          placeholder="Discord / Tag"
                        />
                      </div>
                      <div className="rc-social-input-wrap">
                        <span className="rc-social-prefix">📺</span>
                        <input
                          type="text"
                          value={twitchUrl}
                          onChange={(e) => setTwitchUrl(e.target.value)}
                          className="rc-social-input"
                          placeholder="Twitch channel"
                        />
                      </div>
                      <div className="rc-social-input-wrap">
                        <span className="rc-social-prefix">𝕏</span>
                        <input
                          type="text"
                          value={twitterHandle}
                          onChange={(e) => setTwitterHandle(e.target.value)}
                          className="rc-social-input"
                          placeholder="X handle"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ════ TAB 2: THEME & BOARD ════ */}
            {activeTab === 'theme' && (
              <div className="rc-settings-tab-pane">
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Theme &amp; Board Appearance</h3>
                  <p className="rc-pane-sub">
                    Customize your tactical board surfaces, pieces, and illuminated ambiance.
                  </p>

                  <span className="rc-avi-section-lbl" style={{ marginTop: 14 }}>TACTICAL BOARD MATRIX</span>
                  <div className="rc-board-themes-grid">
                    {BOARD_THEMES.map((theme) => (
                      <div
                        key={theme.id}
                        className={`rc-board-theme-card ${boardTheme === theme.id ? 'selected' : ''}`}
                        onClick={() => setBoardTheme(theme.id)}
                      >
                        <div className="rc-mini-board-preview">
                          <div className="rc-mb-tile" style={{ background: theme.light }} />
                          <div className="rc-mb-tile" style={{ background: theme.dark }} />
                          <div className="rc-mb-tile" style={{ background: theme.dark }} />
                          <div className="rc-mb-tile" style={{ background: theme.light }} />
                          {boardTheme === theme.id && <span className="rc-board-active-tag">Active</span>}
                        </div>
                        <h5 className="rc-btheme-name">{theme.name}</h5>
                        <span className="rc-btheme-desc">{theme.desc}</span>
                      </div>
                    ))}
                  </div>

                  <span className="rc-avi-section-lbl" style={{ marginTop: 20 }}>TACTICAL PIECE STYLES</span>
                  <div className="rc-piece-carvings-grid">
                    {[
                      { id: 'nautical', title: 'Classic Wood', sub: 'Standard tournament high-relief pieces' },
                      { id: 'imperial', title: 'Imperial Carved', sub: 'High-relief regal figures' },
                      { id: 'staunton', title: 'Minimalist Staunton', sub: 'Tournament high-contrast' },
                    ].map((p) => (
                      <div
                        key={p.id}
                        className={`rc-carving-radio-card ${pieceCarving === p.id ? 'active' : ''}`}
                        onClick={() => setPieceCarving(p.id)}
                      >
                        <div className={`rc-radio-circle ${pieceCarving === p.id ? 'checked' : ''}`} />
                        <div>
                          <h5 className="rc-carving-title">{p.title}</h5>
                          <span className="rc-carving-sub">{p.sub}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rc-fields-two-col" style={{ marginTop: 20, alignItems: 'center' }}>
                    <div>
                      <span className="rc-avi-section-lbl">UI ILLUMINATION HUE</span>
                      <div className="rc-hue-dots-row">
                        {[
                          { id: 'gold', color: '#f59e0b' },
                          { id: 'green', color: '#10b981' },
                          { id: 'blue', color: '#0284c7' },
                          { id: 'red', color: '#dc2626' },
                        ].map((h) => (
                          <div
                            key={h.id}
                            className={`rc-hue-circle ${uiHue === h.id ? 'active' : ''}`}
                            style={{ background: h.color }}
                            onClick={() => setUiHue(h.id)}
                          >
                            {uiHue === h.id && <Check size={14} color="#fff" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="rc-label-with-count">
                        <span className="rc-avi-section-lbl">CONTRAST DEPTH</span>
                        <span className="rc-char-counter">Depth ({contrastDepth}%)</span>
                      </div>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        value={contrastDepth}
                        onChange={(e) => setContrastDepth(Number(e.target.value))}
                        className="rc-pane-slider"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 3: AUDIO & SOUND FX ════ */}
            {activeTab === 'audio' && (
              <div className="rc-settings-tab-pane">
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Audio &amp; Sound Effects</h3>
                  <p className="rc-pane-sub">
                    Configure master volume, ambient background audio, and move sound effects.
                  </p>

                  <div className="rc-audio-sliders-list" style={{ marginTop: 14 }}>
                    <div className="rc-slider-row">
                      <div className="rc-slider-label-row">
                        <span className="rc-sl-label">🔊 Master Volume</span>
                        <span className="rc-sl-val">{masterVol}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={masterVol}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setMasterVol(v)
                          audioSettingsStore.setVolume(v / 100)
                        }}
                        onMouseUp={() => audioEngine.playMove()}
                        onTouchEnd={() => audioEngine.playMove()}
                        className="rc-pane-slider rc-slider-gold"
                      />
                    </div>

                    <div className="rc-slider-row">
                      <div className="rc-slider-label-row">
                        <span className="rc-sl-label">🌊 Ambient Background Sound</span>
                        <span className="rc-sl-val">{ambientVol}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={ambientVol}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setAmbientVol(v)
                          audioSettingsStore.setAmbientVolume(v / 100)
                        }}
                        className="rc-pane-slider rc-slider-blue"
                      />
                    </div>

                    <div className="rc-slider-row">
                      <div className="rc-slider-label-row">
                        <span className="rc-sl-label">⚔️ Move &amp; Capture Sound Effects</span>
                        <span className="rc-sl-val">{sfxVol}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={sfxVol}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setSfxVol(v)
                          audioSettingsStore.setSfxVolume(v / 100)
                        }}
                        onMouseUp={() => audioEngine.playMove()}
                        onTouchEnd={() => audioEngine.playMove()}
                        className="rc-pane-slider rc-slider-green"
                      />
                    </div>
                  </div>

                  <div className="rc-field-group" style={{ marginTop: 16 }}>
                    <label className="rc-field-label">SOUND EFFECTS PACK</label>
                    <div className="rc-select-wrap">
                      <select
                        value={sfxLibrary}
                        onChange={(e) => {
                          setSfxLibrary(e.target.value)
                          audioEngine.playCapture()
                        }}
                        className="rc-pane-select"
                      >
                        <option value="classic_wood">Classic Wooden Pieces</option>
                        <option value="naval_cannonade">Arcade &amp; Impact</option>
                        <option value="heavy_stone">Heavy Stone &amp; Marble</option>
                      </select>
                      <ChevronDown size={14} className="rc-select-chevron" />
                    </div>
                  </div>

                  {/* Audio Toggles */}
                  <div className="rc-toggles-list" style={{ marginTop: 16 }}>
                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Check &amp; Checkmate Sound Alert</h5>
                        <p className="rc-toggle-sub">Plays a sound alert and visual highlight when king is in check.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={checkAlarm}
                          onChange={(e) => {
                            setCheckAlarm(e.target.checked)
                            if (e.target.checked) audioEngine.playCheck()
                          }}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Low Time Warning Sound</h5>
                        <p className="rc-toggle-sub">Plays an alert chime during final 10 seconds of move timer.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={lowClockChime}
                          onChange={(e) => {
                            setLowClockChime(e.target.checked)
                            if (e.target.checked) audioEngine.playPromotion()
                          }}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ════ TAB 4: GAMEPLAY & CLOCKS ════ */}
            {activeTab === 'gameplay' && (
              <div className="rc-settings-tab-pane">
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Gameplay &amp; Clock Controls</h3>
                  <p className="rc-pane-sub">
                    Configure board assistance, pre-moves, and pawn promotion.
                  </p>

                  <div className="rc-toggles-list" style={{ marginTop: 16 }}>
                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Auto-Queen on Promotion</h5>
                        <p className="rc-toggle-sub">Automatically promote pawns to Queen without showing a dialog.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={autoQueen}
                          onChange={(e) => setAutoQueen(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Pre-Moves Allowed</h5>
                        <p className="rc-toggle-sub">Queue moves during your opponent's turn with zero clock delay.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={preMoves}
                          onChange={(e) => setPreMoves(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Highlight Legal Moves</h5>
                        <p className="rc-toggle-sub">Display legal move indicators and capture squares on piece selection.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={highlightLegal}
                          onChange={(e) => setHighlightLegal(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Click / Tap Confirmation</h5>
                        <p className="rc-toggle-sub">Require a secondary confirmation click before submitting moves.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={clickConfirmation}
                          onChange={(e) => setClickConfirmation(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 5: ACCOUNT & SECURITY ════ */}
            {activeTab === 'account' && (
              <div className="rc-settings-tab-pane">
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Linked Accounts</h3>
                  <p className="rc-pane-sub">
                    Connect and sync your account across platforms.
                  </p>

                  <div className="rc-linked-accounts-list" style={{ marginTop: 14 }}>
                    <div className="rc-linked-acc-card">
                      <div className="rc-la-info">
                        <CheckCircle2 size={16} className="rc-la-check" />
                        <div>
                          <h5 className="rc-la-name">Steam Sync</h5>
                          <span className="rc-la-status">Connected</span>
                        </div>
                      </div>
                      <button
                        className="rc-btn-la-unlink"
                        onClick={() => setSteamLinked(!steamLinked)}
                      >
                        {steamLinked ? 'UNLINK' : 'CONNECT'}
                      </button>
                    </div>

                    <div className="rc-linked-acc-card">
                      <div className="rc-la-info">
                        <CheckCircle2 size={16} className="rc-la-check" />
                        <div>
                          <h5 className="rc-la-name">Discord Auth</h5>
                          <span className="rc-la-status">Connected</span>
                        </div>
                      </div>
                      <button
                        className="rc-btn-la-unlink"
                        onClick={() => setDiscordLinked(!discordLinked)}
                      >
                        {discordLinked ? 'UNLINK' : 'CONNECT'}
                      </button>
                    </div>

                    <div className="rc-linked-acc-card">
                      <div className="rc-la-info">
                        <div className="rc-la-empty-circle" />
                        <div>
                          <h5 className="rc-la-name">Google Play</h5>
                          <span className="rc-la-status rc-la-dim">Not Linked</span>
                        </div>
                      </div>
                      <button
                        className="rc-btn-la-connect"
                        onClick={() => setGoogleLinked(!googleLinked)}
                      >
                        {googleLinked ? 'UNLINK' : 'CONNECT'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="rc-pane-card rc-danger-zone-card" style={{ marginTop: 16 }}>
                  <span className="rc-danger-zone-tag">DANGER ZONE</span>
                  <h3 className="rc-pane-title">Account Danger Zone</h3>
                  <p className="rc-pane-sub">
                    Permanent and irreversible actions for your account.
                  </p>

                  <div className="rc-danger-actions-list" style={{ marginTop: 14 }}>
                    <div className="rc-danger-row">
                      <div>
                        <h5 className="rc-danger-title">Reset Match Statistics</h5>
                        <p className="rc-danger-sub">Resets win/loss ratio and match history back to zero.</p>
                      </div>
                      <button
                        className="rc-btn-danger-subtle"
                        onClick={() => {
                          if (window.confirm('Reset your seasonal statistics back to Day 1?')) {
                            setToastMsg('Seasonal statistics reset.')
                            setTimeout(() => setToastMsg(null), 3000)
                          }
                        }}
                      >
                        Purge Stats
                      </button>
                    </div>

                    <div className="rc-danger-row">
                      <div>
                        <h5 className="rc-danger-title">Delete Account</h5>
                        <p className="rc-danger-sub">Permanently deletes your account, coins, and stats.</p>
                      </div>
                      <button
                        className="rc-btn-danger-red"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
                            await authStore.deleteAccount()
                            localStorage.removeItem('rc_user_avatar')
                            localStorage.removeItem('rc_user_settings')
                            navigationStore.returnToLanding()
                          }
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 6: NOTIFICATIONS ════ */}
            {activeTab === 'notifications' && (
              <div className="rc-settings-tab-pane">
                <div className="rc-pane-card">
                  <h3 className="rc-pane-title">Notifications</h3>
                  <p className="rc-pane-sub">
                    Control which notifications and match invites you receive.
                  </p>

                  <div className="rc-toggles-list" style={{ marginTop: 16 }}>
                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Friend Request Alerts</h5>
                        <p className="rc-toggle-sub">Show notifications when other players send you a friend request.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={notifFriendReq}
                          onChange={(e) => setNotifFriendReq(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Match Challenge Invitations</h5>
                        <p className="rc-toggle-sub">Receive match invites and direct game challenges from friends.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={notifMatchInvite}
                          onChange={(e) => setNotifMatchInvite(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>

                    <div className="rc-toggle-card">
                      <div>
                        <h5 className="rc-toggle-title">Notification Sounds</h5>
                        <p className="rc-toggle-sub">Play a sound when receiving game alerts and invites.</p>
                      </div>
                      <label className="rc-switch">
                        <input
                          type="checkbox"
                          checked={notifSound}
                          onChange={(e) => setNotifSound(e.target.checked)}
                        />
                        <span className="rc-slider-round" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </section>
        </div>
      </main>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="rc-settings-footer">
        <div className="rc-sfooter-content">
          <div className="rc-sfooter-brand">
            <Crown size={16} className="rc-footer-crown" />
            <span>Royal Chess © 2024 Strategy &amp; Classic Chess.</span>
          </div>
          <div className="rc-sfooter-links">
            <span onClick={() => navigationStore.returnToLanding()}>PLAY</span>
            <span onClick={() => navigationStore.returnToLanding()}>MODES</span>
            <span onClick={() => navigationStore.openProfilePage('leaderboard')}>LEADERBOARD</span>
            <span onClick={() => navigationStore.returnToLanding()}>SHOP</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
export default SettingsPage
