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
  ambientEnabled: boolean
}

type Listener = () => void

class AudioSettingsStore {
  private state: AudioSettings = {
    isMuted: false,
    masterVolume: 0.75,
    ambientEnabled: false, // Default to crisp clean game audio with zero background hiss
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

  toggleAmbient = (): void => {
    const next = !this.state.ambientEnabled
    if (next) {
      audioEngine.startAmbient()
    } else {
      audioEngine.stopAmbient()
    }
    this.setState({ ambientEnabled: next })
  }

  startAmbientIfEnabled = (): void => {
    if (this.state.ambientEnabled && !this.state.isMuted) {
      audioEngine.startAmbient()
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

