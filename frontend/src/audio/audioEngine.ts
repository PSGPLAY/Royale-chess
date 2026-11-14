/**
 * Royal Chess – High-Fidelity Procedural Acoustic Audio Engine
 *
 * Synthesizes natural, pleasing, physical chess and strategy sounds
 * using the Web Audio API with zero external audio assets:
 *  - Organic wooden piece moves & capture knocks
 *  - Crystal musical chimes for checks & promotions
 *  - Metallic golden coin clinks for shop purchases & recruitments
 *  - Triumphant warm victory fanfare
 *  - Ultra-gentle tactile UI clicks
 */

class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private _masterVolume = 0.75
  private _isMuted = false

  // ─── Lazy AudioContext Bootstrap ──────────────────────────────────────────

  private getCtx(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = this._isMuted ? 0 : this._masterVolume
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  private getMaster(): GainNode {
    this.getCtx()
    return this.masterGain!
  }

  // ─── Volume & Mute Controls ───────────────────────────────────────────────

  get masterVolume(): number {
    return this._masterVolume
  }

  get isMuted(): boolean {
    return this._isMuted
  }

  setMasterVolume(v: number): void {
    this._masterVolume = Math.max(0, Math.min(1, v))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this._isMuted ? 0 : this._masterVolume,
        this.ctx.currentTime,
        0.04
      )
    }
  }

  toggleMute(): void {
    this._isMuted = !this._isMuted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this._isMuted ? 0 : this._masterVolume,
        this.ctx.currentTime,
        0.04
      )
    }
  }

  // ─── Sound 1: Natural Wooden Piece Placement ("Move") ─────────────────────
  /**
   * Crisp, organic wood-on-wood "tok" modeled after professional tournament boards.
   */
  playMove(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      // Primary body thump (wood resonance drop)
      const osc = ctx.createOscillator()
      const oscGain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(280, t)
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.055)

      oscGain.gain.setValueAtTime(0.7, t)
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07)

      osc.connect(oscGain)
      oscGain.connect(out)
      osc.start(t)
      osc.stop(t + 0.08)

      // Micro surface impact click (filtered noise pulse, 4ms)
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.015), ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.003))
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 1600
      filter.Q.value = 2.5

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.35, t)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015)

      noise.connect(filter)
      filter.connect(noiseGain)
      noiseGain.connect(out)
      noise.start(t)
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 2: Solid Wooden Capture Knock ("Capture") ──────────────────────
  /**
   * Punchy, resonant wooden piece collision with satisfying weight.
   */
  playCapture(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      // 1. Heavy low body knock
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(220, t)
      osc1.frequency.exponentialRampToValueAtTime(75, t + 0.09)

      gain1.gain.setValueAtTime(0.9, t)
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.11)

      osc1.connect(gain1)
      gain1.connect(out)
      osc1.start(t)
      osc1.stop(t + 0.12)

      // 2. Mid resonant crack
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(480, t)
      osc2.frequency.exponentialRampToValueAtTime(140, t + 0.06)

      gain2.gain.setValueAtTime(0.65, t)
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07)

      osc2.connect(gain2)
      gain2.connect(out)
      osc2.start(t)
      osc2.stop(t + 0.08)

      // 3. Transient sharp wood snap
      const snapBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate)
      const snapData = snapBuf.getChannelData(0)
      for (let i = 0; i < snapData.length; i++) {
        snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.004))
      }
      const snapSrc = ctx.createBufferSource()
      snapSrc.buffer = snapBuf

      const snapFilter = ctx.createBiquadFilter()
      snapFilter.type = 'highpass'
      snapFilter.frequency.value = 1800

      const snapGain = ctx.createGain()
      snapGain.gain.setValueAtTime(0.5, t)
      snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02)

      snapSrc.connect(snapFilter)
      snapFilter.connect(snapGain)
      snapGain.connect(out)
      snapSrc.start(t)
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 3: Pure Musical Bell Alert ("Check") ───────────────────────────
  /**
   * Soft, crystal-clear marimba chime (E5 - A5) to warn player without annoyance.
   */
  playCheck(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      const notes = [
        { freq: 659.25, time: 0.0, dur: 0.28 }, // E5
        { freq: 880.0, time: 0.07, dur: 0.35 },  // A5
      ]

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t + time)

        g.gain.setValueAtTime(0, t + time)
        g.gain.linearRampToValueAtTime(0.4, t + time + 0.006)
        g.gain.exponentialRampToValueAtTime(0.001, t + time + dur)

        osc.connect(g)
        g.connect(out)
        osc.start(t + time)
        osc.stop(t + time + dur + 0.02)
      })
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 4: Golden Coin Clink ("Shop Purchase / Deploy") ────────────────
  /**
   * Crisp, bright, high-frequency metallic coin jingle as pieces are bought/placed.
   */
  playDeploy(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      // Primary coin ring (pure high bell)
      const coins = [
        { freq: 2093.0, time: 0.0, dur: 0.18, vol: 0.35 }, // C7
        { freq: 2637.0, time: 0.03, dur: 0.22, vol: 0.4 },  // E7
        { freq: 1760.0, time: 0.06, dur: 0.15, vol: 0.25 }, // A6
      ]

      coins.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t + time)

        g.gain.setValueAtTime(0, t + time)
        g.gain.linearRampToValueAtTime(vol, t + time + 0.004)
        g.gain.exponentialRampToValueAtTime(0.001, t + time + dur)

        osc.connect(g)
        g.connect(out)
        osc.start(t + time)
        osc.stop(t + time + dur + 0.02)
      })

      // Wood deployment thud
      this.playMove()
    } catch {
      // AudioContext safe catch
    }
  }

  /**
   * Pure golden coin jingle for rerolls and coin earnings.
   */
  playCoin(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      const coins = [
        { freq: 2093.0, time: 0.0, dur: 0.18, vol: 0.35 },
        { freq: 2637.0, time: 0.03, dur: 0.22, vol: 0.4 },
        { freq: 1760.0, time: 0.06, dur: 0.15, vol: 0.25 },
      ]

      coins.forEach(({ freq, time, dur, vol }) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t + time)

        g.gain.setValueAtTime(0, t + time)
        g.gain.linearRampToValueAtTime(vol, t + time + 0.004)
        g.gain.exponentialRampToValueAtTime(0.001, t + time + dur)

        osc.connect(g)
        g.connect(out)
        osc.start(t + time)
        osc.stop(t + time + dur + 0.02)
      })
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 5: Pawn Promotion Arpeggio ─────────────────────────────────────
  /**
   * Ascending celesta chime flourish.
   */
  playPromotion(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5] // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const start = t + idx * 0.045
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, start)

        g.gain.setValueAtTime(0, start)
        g.gain.linearRampToValueAtTime(0.3, start + 0.005)
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.3)

        osc.connect(g)
        g.connect(out)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 6: Triumphant Warm Victory Fanfare ─────────────────────────────
  /**
   * Warm, majestic harmonic chord progression (no harsh buzzing saws).
   */
  playVictory(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      // Major chord stack: C4, G4, C5, E5, G5
      const chords = [
        // Chord 1: Warm intro C Major
        { freqs: [261.63, 392.0, 523.25], start: 0.0, dur: 0.35, vol: 0.25 },
        // Chord 2: F Major
        { freqs: [349.23, 440.0, 698.46], start: 0.32, dur: 0.35, vol: 0.28 },
        // Chord 3: Grand C Major finale
        { freqs: [261.63, 392.0, 523.25, 659.25, 1046.5], start: 0.65, dur: 0.95, vol: 0.35 },
      ]

      chords.forEach(({ freqs, start, dur, vol }) => {
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(freq, t + start)

          g.gain.setValueAtTime(0, t + start)
          g.gain.linearRampToValueAtTime(vol / freqs.length, t + start + 0.02)
          g.gain.exponentialRampToValueAtTime(0.001, t + start + dur)

          osc.connect(g)
          g.connect(out)
          osc.start(t + start)
          osc.stop(t + start + dur + 0.05)
        })
      })
    } catch {
      // AudioContext safe catch
    }
  }

  playCheckmate(): void {
    this.playVictory()
  }

  // ─── Sound 7: Draw Result Sound ──────────────────────────────────────────
  playDraw(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      const chord = [392.0, 493.88, 587.33] // G, B, D gentle fade
      chord.forEach((freq) => {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)

        g.gain.setValueAtTime(0.18, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)

        osc.connect(g)
        g.connect(out)
        osc.start(t)
        osc.stop(t + 0.65)
      })
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Sound 8: Tactile Soft UI Click ──────────────────────────────────────
  playButtonClick(): void {
    try {
      const ctx = this.getCtx()
      const t = ctx.currentTime
      const out = this.getMaster()

      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, t)
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.025)

      g.gain.setValueAtTime(0.18, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.03)

      osc.connect(g)
      g.connect(out)
      osc.start(t)
      osc.stop(t + 0.035)
    } catch {
      // AudioContext safe catch
    }
  }

  // ─── Ambient controls (Quiet / Optional) ──────────────────────────────────
  startAmbient(): void {
    // Kept ultra quiet & optional
  }

  stopAmbient(): void {
    // No-op
  }
}

export const audioEngine = new AudioEngine()
