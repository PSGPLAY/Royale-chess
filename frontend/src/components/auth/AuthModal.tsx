import type { FC, FormEvent } from 'react'
import { useState } from 'react'
import { X, Crown, User, Lock, Mail, LogIn, UserPlus, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuthStore, authStore } from '../../state/authStore'
import { audioEngine } from '../../audio/audioEngine'

export const AuthModal: FC = () => {
  const { isAuthModalOpen, isLoading, error } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (!isAuthModalOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    audioEngine.playButtonClick()

    if (tab === 'login') {
      await authStore.login(username, password)
    } else {
      await authStore.register(username, email, password)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={() => authStore.closeAuthModal()}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header with Brand Icon */}
        <div className="auth-header">
          <div className="auth-badge-icon">
            <Crown size={22} className="crown-glow" />
          </div>
          <h2 className="auth-title">
            {tab === 'login' ? 'Log In' : 'Create an Account'}
          </h2>
          <p className="auth-subtitle">
            {tab === 'login'
              ? 'Log in to track your ELO rating, persistent coins & match history'
              : 'Create an account to join online ranked battles & lead the fleet'}
          </p>

          <button
            className="auth-close-btn"
            onClick={() => authStore.closeAuthModal()}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => {
              audioEngine.playButtonClick()
              setTab('login')
            }}
          >
            <LogIn size={15} />
            <span>Log In</span>
          </button>
          <button
            className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              audioEngine.playButtonClick()
              setTab('register')
            }}
          >
            <UserPlus size={15} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">
              {tab === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="auth-input-wrapper">
              {tab === 'login' && username.includes('@') ? (
                <Mail size={16} className="input-icon" />
              ) : (
                <User size={16} className="input-icon" />
              )}
              <input
                type="text"
                required
                className="auth-input"
                placeholder={tab === 'login' ? 'e.g. CaptainJack or jack@sea.com' : 'e.g. CaptainJack'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {tab === 'register' && (
            <div className="auth-input-group">
              <label className="auth-label">Email Address (Optional)</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="commander@sea.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">Secret Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => {
                  audioEngine.playButtonClick()
                  setShowPassword(!showPassword)
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : tab === 'login' ? (
              <>
                <LogIn size={16} />
                <span>Log In & Play</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

