import type { FC } from 'react'
import { lazy, Suspense } from 'react'
import { LandingPage } from './components/landing/LandingPage'
import { AuthModal } from './components/auth/AuthModal'
import { ProfilePage } from './components/profile/ProfilePage'
import { MatchmakingModal } from './components/multiplayer/MatchmakingModal'
import { useNavigationStore } from './state/appNavigationStore'
import './App.css'

const GameScreen = lazy(() => import('./components/game/GameScreen'))

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
    </>
  )
}

export default App
