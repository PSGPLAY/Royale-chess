/**
 * Audio Settings Store
 * Persists mute state and volume level across renders.
 * Kept separate from the audio engine so the engine stays free
 * of React dependencies.
 */
import { useSyncExternalStore } from 'react'
import { audioEngine } from './audioEngine'

export interface AudioSettings {
  isMuted: boolean
  masterVolume: number
  ambientVolume: number
  sfxVolume: number
  ambientEnabled: boolean
}

type Listener = () => void

class AudioSettingsStore {
  private state: AudioSettings = {
    isMuted: false,
    masterVolume: 0.75,
    ambientVolume: 0.5,
    sfxVolume: 1.0,
    ambientEnabled: false,
  }

  private listeners = new Set<Listener>()

  getState = (): AudioSettings => this.state

  private setState = (partial: Partial<AudioSettings>): void => {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach((l) => l())
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  toggleMute = (): void => {
    audioEngine.toggleMute()
    this.setState({ isMuted: audioEngine.isMuted })
  }

  setVolume = (v: number): void => {
    audioEngine.setMasterVolume(v)
    this.setState({ masterVolume: audioEngine.masterVolume })
  }

  setSfxVolume = (v: number): void => {
    audioEngine.setSfxVolume(v)
    this.setState({ sfxVolume: v })
  }

  setAmbientVolume = (v: number): void => {
    audioEngine.setAmbientVolume(v)
    const enabled = v > 0
    if (enabled && !this.state.ambientEnabled) {
      audioEngine.startAmbient(v)
    } else if (!enabled && this.state.ambientEnabled) {
      audioEngine.stopAmbient()
    }
    this.setState({ ambientVolume: v, ambientEnabled: enabled })
  }

  toggleAmbient = (): void => {
    const next = !this.state.ambientEnabled
    if (next) {
      audioEngine.startAmbient(this.state.ambientVolume)
    } else {
      audioEngine.stopAmbient()
    }
    this.setState({ ambientEnabled: next })
  }

  startAmbientIfEnabled = (): void => {
    if (this.state.ambientEnabled && !this.state.isMuted) {
      audioEngine.startAmbient(this.state.ambientVolume)
    }
  }

  stopAmbient = (): void => {
    audioEngine.stopAmbient()
  }
}

export const audioSettingsStore = new AudioSettingsStore()

export function useAudioSettings(): AudioSettings {
  return useSyncExternalStore(
    audioSettingsStore.subscribe,
    audioSettingsStore.getState
  )
}

