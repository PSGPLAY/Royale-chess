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
}

type Listener = () => void

class NavigationStore {
  private state: NavigationState = {
    currentScreen: 'landing', // Starts on the chess.com-style landing page
    activeModeId: 'pvp_royale',
    profileTab: 'overview',
  }

  private listeners = new Set<Listener>()

  getState = (): NavigationState => this.state

  private setState = (partial: Partial<NavigationState>) => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((listener) => listener())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Starts a game with the selected mode definition
   */
  launchGame = (modeId: GameModeId) => {
    const mode = GAME_MODES.find((m) => m.id === modeId)
    if (!mode || mode.isComingSoon) return

    // Configure royalModeStore
    royalModeStore.setGameMode(mode.isRoyaleRules ? 'royal' : 'classic')
    royalModeStore.resetWallets()

    // Configure gameStore with starting FEN and Royale Mode status
    gameStore.startMatchWithFen(mode.startingFen || undefined, mode.title, mode.isRoyaleRules)

    this.setState({
      currentScreen: 'game',
      activeModeId: modeId,
    })
  }

  /**
   * Switches to the game screen for an online match without resetting server state
   */
  launchOnlineMatch = (isRoyale: boolean) => {
    royalModeStore.setGameMode(isRoyale ? 'royal' : 'classic')
    this.setState({
      currentScreen: 'game',
      activeModeId: isRoyale ? 'royale' : 'normal',
    })
  }

  openProfilePage = (profileTab: ProfileTab = 'overview') => {
    this.setState({ currentScreen: 'profile', profileTab })
  }

  /**
   * Returns to the landing page / main menu
   */
  returnToLanding = () => {
    this.setState({ currentScreen: 'landing' })
  }
}

export const navigationStore = new NavigationStore()

export function useNavigationStore(): NavigationState {
  return useSyncExternalStore(navigationStore.subscribe, navigationStore.getState)
}

