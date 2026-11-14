import { useSyncExternalStore } from 'react'
import { api } from '../api/client'
import type { UserProfileData } from '../api/client'

export interface AuthState {
  user: UserProfileData | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isAuthModalOpen: boolean
  isProfileModalOpen: boolean
}

type Listener = () => void

class AuthStore {
  private state: AuthState = {
    user: null,
    token: localStorage.getItem('royal_chess_auth_token'),
    isAuthenticated: !!localStorage.getItem('royal_chess_auth_token'),
    isLoading: false,
    error: null,
    isAuthModalOpen: false,
    isProfileModalOpen: false,
  }

  private listeners = new Set<Listener>()

  constructor() {
    if (this.state.token) {
      this.refreshProfile().catch(() => {
        // Token expired or invalid -> clear
        this.logout()
      })
    }
  }

  getState = (): AuthState => this.state

  private setState = (partial: Partial<AuthState>) => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((l) => l())
  }

  subscribe = (listener: Listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  openAuthModal = () => {
    this.setState({ isAuthModalOpen: true, error: null })
  }

  closeAuthModal = () => {
    this.setState({ isAuthModalOpen: false, error: null })
  }

  openProfileModal = () => {
    this.setState({ isProfileModalOpen: true })
  }

  closeProfileModal = () => {
    this.setState({ isProfileModalOpen: false })
  }

  login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    this.setState({ isLoading: true, error: null })
    try {
      const res = await api.login(usernameOrEmail, password)
      localStorage.setItem('royal_chess_auth_token', res.token)
      this.setState({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
        isAuthModalOpen: false,
      })
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed'
      this.setState({ isLoading: false, error: message })
      return false
    }
  }

  register = async (username: string, email: string, password: string): Promise<boolean> => {
    this.setState({ isLoading: true, error: null })
    try {
      const res = await api.register(username, email, password)
      localStorage.setItem('royal_chess_auth_token', res.token)
      this.setState({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
        isAuthModalOpen: false,
      })
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      this.setState({ isLoading: false, error: message })
      return false
    }
  }

  logout = async () => {
    try {
      if (this.state.token) {
        await api.logout()
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('royal_chess_auth_token')
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isProfileModalOpen: false,
      })
    }
  }

  refreshProfile = async (): Promise<void> => {
    try {
      const profile = await api.getProfile()
      this.setState({ user: profile, isAuthenticated: true })
    } catch {
      // ignore
    }
  }
}

export const authStore = new AuthStore()

export function useAuthStore(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState)
}

