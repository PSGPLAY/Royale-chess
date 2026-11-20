import { useSyncExternalStore } from 'react'
import { api, ApiError, AUTH_PROFILE_STORAGE_KEY } from '../api/client'
import type { UserProfileData } from '../api/client'

const AUTH_TOKEN_STORAGE_KEY = 'royal_chess_auth_token'

function readStoredProfile(): UserProfileData | null {
  const storedProfile = localStorage.getItem(AUTH_PROFILE_STORAGE_KEY)
  if (!storedProfile) return null

  try {
    const profile = JSON.parse(storedProfile) as UserProfileData
    return typeof profile.id === 'number' && typeof profile.username === 'string'
      ? profile
      : null
  } catch {
    localStorage.removeItem(AUTH_PROFILE_STORAGE_KEY)
    return null
  }
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(AUTH_PROFILE_STORAGE_KEY)
}

const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

export interface AuthState {
  user: UserProfileData | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isAuthModalOpen: boolean
}

type Listener = () => void

class AuthStore {
  private state: AuthState = {
    user: storedToken ? readStoredProfile() : null,
    token: storedToken,
    isAuthenticated: !!storedToken,
    isLoading: false,
    error: null,
    isAuthModalOpen: false,
  }

  private listeners = new Set<Listener>()

  constructor() {
    if (this.state.token) {
      void this.refreshProfile()
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

  login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    this.setState({ isLoading: true, error: null })
    try {
      const res = await api.login(usernameOrEmail, password)
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, res.token)
      localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(res.user))
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
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, res.token)
      localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(res.user))
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
      clearStoredSession()
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
    }
  }

  deleteAccount = async (): Promise<boolean> => {
    try {
      if (this.state.token) {
        await api.deleteAccount()
      }
      clearStoredSession()
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
      return true
    } catch (err: unknown) {
      console.error('Account deletion error:', err)
      clearStoredSession()
      this.setState({
        user: null,
        token: null,
        isAuthenticated: false,
      })
      return false
    }
  }

  refreshProfile = async (): Promise<void> => {
    try {
      const profile = await api.getProfile()
      localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(profile))
      this.setState({ user: profile, isAuthenticated: true })
    } catch (error: unknown) {
      // Keep the cached session during network failures, but remove credentials
      // that the server has explicitly rejected.
      if (error instanceof ApiError && error.status === 401) {
        clearStoredSession()
        this.setState({ user: null, token: null, isAuthenticated: false })
      }
    }
  }

  updateUser = (user: UserProfileData): void => {
    localStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(user))
    this.setState({ user })
  }
}

export const authStore = new AuthStore()

export function useAuthStore(): AuthState {
  return useSyncExternalStore(authStore.subscribe, authStore.getState)
}

