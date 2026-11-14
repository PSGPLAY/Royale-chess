/**
 * AudioControls
 * ─────────────
 * Compact floating audio panel: mute toggle, volume slider, ambient toggle.
 * Designed to sit in the top-right corner of the game screen.
 */
import type { FC } from 'react'
import { useState } from 'react'
import { Volume2, VolumeX, Music, Waves } from 'lucide-react'
import { audioSettingsStore, useAudioSettings } from '../../audio/audioSettingsStore'
import { audioEngine } from '../../audio/audioEngine'

export const AudioControls: FC = () => {
  const { isMuted, masterVolume, ambientEnabled } = useAudioSettings()
  const [expanded, setExpanded] = useState(false)

  const handleToggleMute = () => {
    audioEngine.playButtonClick()
    audioSettingsStore.toggleMute()
  }

  const handleToggleAmbient = () => {
    audioEngine.playButtonClick()
    audioSettingsStore.toggleAmbient()
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioSettingsStore.setVolume(Number(e.target.value))
  }

  const handleExpand = () => {
    audioEngine.playButtonClick()
    setExpanded((v) => !v)
  }

  return (
    <div className={`audio-controls-widget ${expanded ? 'expanded' : ''}`}>
      {/* Main mute/expand button */}
      <button
        className="audio-main-btn"
        onClick={handleToggleMute}
        onContextMenu={(e) => { e.preventDefault(); handleExpand() }}
        title={isMuted ? 'Unmute (right-click for settings)' : 'Mute (right-click for settings)'}
      >
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {/* Expand chevron */}
      <button
        className="audio-expand-btn"
        onClick={handleExpand}
        title="Audio settings"
      >
        <span className="expand-caret">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="audio-panel">
          <div className="audio-panel-header">
            <Music size={13} />
            <span>Audio</span>
          </div>

          {/* Volume slider */}
          <div className="audio-row">
            <span className="audio-label">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={handleVolumeChange}
              className="volume-slider"
              disabled={isMuted}
            />
            <span className="vol-pct">{Math.round(masterVolume * 100)}%</span>
          </div>

          {/* Ambient toggle */}
          <div className="audio-row">
            <Waves size={13} />
            <span className="audio-label">Ocean Ambient</span>
            <button
              className={`toggle-pill ${ambientEnabled ? 'on' : 'off'}`}
              onClick={handleToggleAmbient}
            >
              {ambientEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Mute all */}
          <div className="audio-row">
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="audio-label">Master Mute</span>
            <button
              className={`toggle-pill ${isMuted ? 'off' : 'on'}`}
              onClick={handleToggleMute}
            >
              {isMuted ? 'MUTED' : 'ON'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

