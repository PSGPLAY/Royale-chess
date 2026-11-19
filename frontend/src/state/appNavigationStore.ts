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
  profileUsername: string | null
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

/**
 * Parses the current browser URL pathname into NavigationState
 */
export function parseUrlToState(): NavigationState {
  if (typeof window === 'undefined') {
    return {
      currentScreen: 'landing',
      activeModeId: 'royale',
      profileTab: 'overview',
      profileUsername: null,
    }
  }

  const rawPath = window.location.pathname.trim()
  const path = rawPath.replace(/\/+$/, '') || '/'
  const lowerPath = path.toLowerCase()

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
      profileUsername: null,
    }
  }

  // 2. Profile routes
  if (lowerPath.startsWith('/profile')) {
    const parts = lowerPath.split('/').filter(Boolean)
    const subTab = parts[1]
    let profileTab: ProfileTab = 'overview'
    if (subTab === 'history' || subTab === 'matches') {
      profileTab = 'history'
    } else if (subTab === 'leaderboard' || subTab === 'rankings') {
      profileTab = 'leaderboard'
    }
    return {
      currentScreen: 'profile',
      activeModeId: 'royale',
      profileTab,
      profileUsername: null,
    }
  }

  const profileMatch = path.match(/^\/([a-zA-Z0-9_.-]+)$/)
  if (profileMatch && !['home', 'game', 'play', 'rankings', 'leaderboard'].includes(profileMatch[1].toLowerCase())) {
    return { currentScreen: 'profile', activeModeId: 'royale', profileTab: 'overview', profileUsername: decodeURIComponent(profileMatch[1]) }
  }
  const namedProfileHistory = path.match(/^\/([a-zA-Z0-9_.-]+)\/(history|matches)$/i)
  if (namedProfileHistory) {
    return { currentScreen: 'profile', activeModeId: 'royale', profileTab: 'history', profileUsername: decodeURIComponent(namedProfileHistory[1]) }
  }

  // 3. Game routes: /game, /game/royale, /game/normal, /game/pvp_royale, etc.
  if (path.startsWith('/game') || path.startsWith('/play')) {
    const parts = path.split('/').filter(Boolean)
    const modePart = parts[1] as GameModeId | undefined
    const activeModeId = modePart && VALID_MODES.includes(modePart) ? modePart : 'royale'
    return {
      currentScreen: 'game',
      activeModeId,
      profileTab: 'overview',
      profileUsername: null,
    }
  }

  // 4. Default to landing page (/, /home, etc.)
  return {
    currentScreen: 'landing',
    activeModeId: 'royale',
    profileTab: 'overview',
    profileUsername: null,
  }
}

/**
 * Returns the canonical URL path for a given NavigationState
 */
export function getPathFromState(state: NavigationState): string {
  if (state.currentScreen === 'game') {
    return `/game/${state.activeModeId}`
  }
  if (state.currentScreen === 'profile') {
    if (state.profileTab === 'leaderboard') return '/rankings'
    const base = state.profileUsername ? `/${encodeURIComponent(state.profileUsername)}` : '/profile'
    if (state.profileTab === 'history') return `${base}/history`
    return base
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
    // 1. Initialize state from current URL
    this.state = parseUrlToState()

    // 2. If user loaded directly into a game URL, initialize game state
    if (this.state.currentScreen === 'game') {
      initGameMode(this.state.activeModeId)
    }

    // 3. Listen to browser Back/Forward popstate events
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
    })
  }

  /**
   * Switches to the game screen for an online match without resetting server state
   * Updates URL to /game/royale or /game/normal
   */
  launchOnlineMatch = (isRoyale: boolean) => {
    royalModeStore.setGameMode(isRoyale ? 'royal' : 'classic')
    this.updateStateAndUrl({
      currentScreen: 'game',
      activeModeId: isRoyale ? 'royale' : 'normal',
    })
  }

  /**
   * Opens profile page with the specified tab and updates URL to /profile or /rankings
   */
  openProfilePage = (profileTab: ProfileTab = 'overview', profileUsername: string | null = null) => {
    this.updateStateAndUrl({ currentScreen: 'profile', profileTab, profileUsername })
  }

  /**
   * Returns to the landing page / main menu and updates URL to /
   */
  returnToLanding = () => {
    this.updateStateAndUrl({ currentScreen: 'landing' })
  }
}

export const navigationStore = new NavigationStore()

export function useNavigationStore(): NavigationState {
  return useSyncExternalStore(navigationStore.subscribe, navigationStore.getState)
}
