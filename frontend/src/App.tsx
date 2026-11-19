import type { FC } from 'react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { LandingPage } from './components/landing/LandingPage'
import { AuthModal } from './components/auth/AuthModal'
import { ProfilePage } from './components/profile/ProfilePage'
import { MatchmakingModal } from './components/multiplayer/MatchmakingModal'
import { useNavigationStore } from './state/appNavigationStore'
import { useAuthStore } from './state/authStore'
import { api } from './api/client'
import './App.css'

const GameScreen = lazy(() => import('./components/game/GameScreen'))

/** Global friend-request toast rendered at App level so it works on every screen */
const FriendRequestNotifier: FC = () => {
  const { isAuthenticated } = useAuthStore()
  const [toast, setToast] = useState<string | null>(null)
  const prevCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isAuthenticated) return

    // Seed the initial count so we only toast on *new* requests
    api.getFriends()
      .then((data) => { prevCountRef.current = data.received_requests.length })
      .catch(() => {})

    const interval = setInterval(() => {
      api.getFriends()
        .then((data) => {
          const newCount = data.received_requests.length
          if (newCount > prevCountRef.current) {
            const delta = newCount - prevCountRef.current
            setToast(`📨 You have ${delta} new friend request${delta > 1 ? 's' : ''}!`)
            setTimeout(() => setToast(null), 7000)
          }
          prevCountRef.current = newCount
        })
        .catch(() => {})
    }, 15000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  if (!toast) return null
  return (
    <div className="rc-global-friend-toast" onClick={() => setToast(null)} title="Click to dismiss">
      <span>{toast}</span>
      <span className="rc-gft-dismiss">✕</span>
    </div>
  )
}

export const App: FC = () => {
  const { currentScreen } = useNavigationStore()

  return (
    <>
      <Suspense fallback={<div className="app-screen-loading" role="status">Loading game…</div>}>
        {currentScreen === 'landing'
          ? <LandingPage />
          : currentScreen === 'profile'
            ? <ProfilePage />
            : <GameScreen />}
      </Suspense>

      {/* Global authentication and matchmaking overlays */}
      <AuthModal />
      <MatchmakingModal />

      {/* Global friend-request notifier (polls every 15 s across all screens) */}
      <FriendRequestNotifier />
    </>
  )
}

export default App
