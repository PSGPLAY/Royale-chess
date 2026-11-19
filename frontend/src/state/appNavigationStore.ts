import { useSyncExternalStore } from 'react'
import type { GameModeId } from './gameModeConfig'
import { GAME_MODES } from './gameModeConfig'
import { gameStore } from './gameStore'
import { royalModeStore } from '../royal/royalModeStore'

export type ProfileTab = 'overview' | 'history' | 'leaderboard'
export type AppScreen = 'landing' | 'game' | 'profile'

export interface NavigationState {
  currentScreen: AppScreen
  activeModeId: GameModeId
  profileTab: ProfileTab
  viewingUsername?: string
}

type Listener = () => void

const VALID_MODES: GameModeId[] = [
  'royale',
  'normal',
  'unranked_royale',
  'pvp_royale',
  'pvp_normal',
  'blind',
]

const RESERVED_ROUTES = new Set([
  '',
  'home',
  'landing',
  'game',
  'play',
  'profile',
  'rankings',
  'leaderboard',
  'armory',
  'modes',
  'watch',
  'api',
  'static',
  'assets',
  'favicon.ico',
])

/**
 * Parses the current browser URL pathname into NavigationState
 */
export function parseUrlToState(): NavigationState {
  if (typeof window === 'undefined') {
    return {
      currentScreen: 'landing',
      activeModeId: 'royale',
      profileTab: 'overview',
    }
  }

  const rawPath = window.location.pathname.trim()
  const path = rawPath.replace(/\/+$/, '') || '/'
  const lowerPath = path.toLowerCase()
  const parts = path.split('/').filter(Boolean)

  // 1. Rankings / Leaderboard direct shortcuts
  if (
    lowerPath === '/rankings' ||
    lowerPath === '/leaderboard' ||
    lowerPath === '/profile/leaderboard' ||
    lowerPath === '/profile/rankings'
  ) {
    return {
      currentScreen: 'profile',
      activeModeId: 'royale',
      profileTab: 'leaderboard',
    }
  }

  // 2. Profile routes: /profile, /profile/history, /profile/:username
  if (lowerPath.startsWith('/profile')) {
    const sub = parts[1]
    if (sub) {
      const lowerSub = sub.toLowerCase()
      if (lowerSub === 'history' || lowerSub === 'matches') {
        return {
          currentScreen: 'profile',
          activeModeId: 'royale',
          profileTab: 'history',
        }
      }
      if (lowerSub === 'leaderboard' || lowerSub === 'rankings') {
        return {
          currentScreen: 'profile',
          activeModeId: 'royale',
          profileTab: 'leaderboard',
        }
      }
      // Viewing a specific username under /profile/:username
      return {
        currentScreen: 'profile',
        activeModeId: 'royale',
        profileTab: 'overview',
        viewingUsername: sub,
      }
    }
    return {
      currentScreen: 'profile',
      activeModeId: 'royale',
      profileTab: 'overview',
    }
  }

  // 3. Game routes: /game, /game/royale, /game/normal, /game/pvp_royale, etc.
  if (lowerPath.startsWith('/game') || lowerPath.startsWith('/play')) {
    const modePart = parts[1] as GameModeId | undefined
    const activeModeId = modePart && VALID_MODES.includes(modePart) ? modePart : 'royale'
    return {
      currentScreen: 'game',
      activeModeId,
      profileTab: 'overview',
    }
  }

  // 4. Custom user profile route: /:username (e.g. royalechess.com/pp)
  if (parts.length === 1 && !RESERVED_ROUTES.has(parts[0].toLowerCase())) {
    return {
      currentScreen: 'profile',
      activeModeId: 'royale',
      profileTab: 'overview',
      viewingUsername: parts[0],
    }
  }

  // 5. Default to landing page
  return {
    currentScreen: 'landing',
    activeModeId: 'royale',
    profileTab: 'overview',
  }
}

/**
 * Returns the canonical URL path for a given NavigationState
 */
export function getPathFromState(state: NavigationState): string {
  if (state.viewingUsername) {
    return `/${state.viewingUsername}`
  }
  if (state.currentScreen === 'game') {
    return `/game/${state.activeModeId}`
  }
  if (state.currentScreen === 'profile') {
    if (state.profileTab === 'leaderboard') return '/rankings'
    if (state.profileTab === 'history') return '/profile/history'
    return '/profile'
  }
  return '/'
}

/**
 * Configures the game and royal rules stores for a given mode
 */
function initGameMode(modeId: GameModeId) {
  const mode = GAME_MODES.find((m) => m.id === modeId) || GAME_MODES[0]
  if (!mode || mode.isComingSoon) return

  royalModeStore.setGameMode(mode.isRoyaleRules ? 'royal' : 'classic')
  royalModeStore.resetWallets()
  gameStore.startMatchWithFen(mode.startingFen || undefined, mode.title, mode.isRoyaleRules)
}

class NavigationStore {
  private state: NavigationState
  private listeners = new Set<Listener>()

  constructor() {
    this.state = parseUrlToState()

    if (this.state.currentScreen === 'game') {
      initGameMode(this.state.activeModeId)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState)
    }
  }

  getState = (): NavigationState => this.state

  private updateStateAndUrl = (partial: Partial<NavigationState>, replace = false) => {
    const newState = { ...this.state, ...partial }
    this.state = newState

    if (typeof window !== 'undefined') {
      const targetPath = getPathFromState(newState)
      const currentPath = window.location.pathname
      if (currentPath !== targetPath) {
        if (replace) {
          window.history.replaceState(null, '', targetPath)
        } else {
          window.history.pushState(null, '', targetPath)
        }
      }
    }

    this.listeners.forEach((listener) => listener())
  }

  private handlePopState = () => {
    const newState = parseUrlToState()
    if (newState.currentScreen === 'game' && this.state.currentScreen !== 'game') {
      initGameMode(newState.activeModeId)
    }
    this.state = newState
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Starts a game with the selected mode definition and updates URL to /game/:modeId
   */
  launchGame = (modeId: GameModeId) => {
    const mode = GAME_MODES.find((m) => m.id === modeId)
    if (!mode || mode.isComingSoon) return

    initGameMode(modeId)

    this.updateStateAndUrl({
      currentScreen: 'game',
      activeModeId: modeId,
      viewingUsername: undefined,
    })
  }

  /**
   * Switches to the game screen for an online match without resetting server state
   */
  launchOnlineMatch = (isRoyale: boolean) => {
    royalModeStore.setGameMode(isRoyale ? 'royal' : 'classic')
    this.updateStateAndUrl({
      currentScreen: 'game',
      activeModeId: isRoyale ? 'royale' : 'normal',
      viewingUsername: undefined,
    })
  }

  /**
   * Opens profile page with the specified tab and updates URL to /profile or /rankings or /:username
   */
  openProfilePage = (profileTab: ProfileTab = 'overview', viewingUsername?: string) => {
    this.updateStateAndUrl({
      currentScreen: 'profile',
      profileTab,
      viewingUsername,
    })
  }

  /**
   * Opens a specific user's public profile by username: /:username
   */
  openUserProfile = (username: string) => {
    this.updateStateAndUrl({
      currentScreen: 'profile',
      profileTab: 'overview',
      viewingUsername: username,
    })
  }

  /**
   * Returns to the landing page / main menu and updates URL to /
   */
  returnToLanding = () => {
    this.updateStateAndUrl({
      currentScreen: 'landing',
      viewingUsername: undefined,
    })
  }
}

export const navigationStore = new NavigationStore()

export function useNavigationStore(): NavigationState {
  return useSyncExternalStore(navigationStore.subscribe, navigationStore.getState)
}
