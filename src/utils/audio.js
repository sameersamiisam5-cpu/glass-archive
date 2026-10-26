/**
 * The Glass Archive — Web Audio Generative Soundscape Engine
 * 100% native Web Audio API — zero external dependencies
 */

class SoundscapeEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.ambientGain = null
    this.sfxGain = null
    this.isMuted = true
    this.isInitialized = false

    // Ambient nodes
    this.droneOsc1 = null
    this.droneOsc2 = null
    this.droneFilter = null
    this.lfo = null
    this.lfoGain = null

    // Visualizer analysis
    this.analyser = null
    this.dataArray = null

    // Resonant temple singing bowl frequencies (Japanese Hirajoshi mode: D, Eb, G, Ab, C)
    this.chimeFrequencies = [293.66, 311.13, 392.00, 415.30, 523.25]
  }

  init() {
    if (this.isInitialized) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return

    this.ctx = new AudioContext()

    // Master bus
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)

    // Analyser for real-time HUD visualizer
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 64
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)

    // Buses
    this.ambientGain = this.ctx.createGain()
    this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime)

    this.sfxGain = this.ctx.createGain()
    this.sfxGain.gain.setValueAtTime(0.45, this.ctx.currentTime)

    this.ambientGain.connect(this.masterGain)
    this.sfxGain.connect(this.masterGain)
    this.masterGain.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)

    this.startAmbientGenerativeDrone()
    this.isInitialized = true
  }

  startAmbientGenerativeDrone() {
    if (!this.ctx) return

    // Sub-bass drone 1 (Warm Triangle)
    this.droneOsc1 = this.ctx.createOscillator()
    this.droneOsc1.type = 'triangle'
    this.droneOsc1.frequency.setValueAtTime(55.0, this.ctx.currentTime) // A1

    // Sub-bass drone 2 (Detuned Sine)
    this.droneOsc2 = this.ctx.createOscillator()
    this.droneOsc2.type = 'sine'
    this.droneOsc2.frequency.setValueAtTime(55.6, this.ctx.currentTime) // Slight beat frequency

    // Resonant lowpass filter
    this.droneFilter = this.ctx.createBiquadFilter()
    this.droneFilter.type = 'lowpass'
    this.droneFilter.frequency.setValueAtTime(140, this.ctx.currentTime)
    this.droneFilter.Q.setValueAtTime(3.5, this.ctx.currentTime)

    // LFO for slow atmospheric breathing
    this.lfo = this.ctx.createOscillator()
    this.lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime) // ~8 sec period

    this.lfoGain = this.ctx.createGain()
    this.lfoGain.gain.setValueAtTime(45, this.ctx.currentTime)

    this.lfo.connect(this.lfoGain)
    this.lfoGain.connect(this.droneFilter.frequency)

    this.droneOsc1.connect(this.droneFilter)
    this.droneOsc2.connect(this.droneFilter)
    this.droneFilter.connect(this.ambientGain)

    this.droneOsc1.start()
    this.droneOsc2.start()
    this.lfo.start()
  }

  // Modulate soundscape with scroll velocity & camera movement
  modulate(velocity) {
    if (!this.isInitialized || this.isMuted || !this.droneFilter) return
    const v = Math.min(Math.abs(velocity), 3.0)
    const targetFreq = 140 + v * 120
    this.droneFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.25)
  }

  // Delicate micro-tick for UI button & pill hovers (safely throttled)
  playTick() {
    try {
      if (!this.isInitialized || this.isMuted || !this.ctx) return
      if (this.ctx.state !== 'running') return // Never force-resume on hover

      // Throttle ticks to max 1 per 60ms
      const now = this.ctx.currentTime
      if (this._lastTick && now - this._lastTick < 0.06) return
      this._lastTick = now

      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1400, now)
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.02)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, now)
      filter.Q.setValueAtTime(2.0, now)

      gain.gain.setValueAtTime(0.04, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025)

      osc.connect(filter)
      filter.connect(gain)
      if (this.sfxGain) gain.connect(this.sfxGain)

      osc.start(now)
      osc.stop(now + 0.03)
    } catch {}
  }

  // Resonant singing bowl entrance chime for Enter Sanctuary
  playSanctuaryChime() {
    try {
      if (!this.ctx) this.init()
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }
      if (!this.ctx || !this.sfxGain) return

      const now = this.ctx.currentTime
      const fund = 293.66 // D4 Hirajoshi root

      // Layer 1: Fundamental warm bell
      const osc1 = this.ctx.createOscillator()
      const gain1 = this.ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(fund, now)
      gain1.gain.setValueAtTime(0.001, now)
      gain1.gain.linearRampToValueAtTime(0.24, now + 0.04)
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 3.4)

      // Layer 2: Shimmering fifth harmonic partial
      const osc2 = this.ctx.createOscillator()
      const gain2 = this.ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(fund * 2.76, now)
      gain2.gain.setValueAtTime(0.001, now)
      gain2.gain.linearRampToValueAtTime(0.09, now + 0.02)
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 2.2)

      // Layer 3: Sub bowl warmth
      const osc3 = this.ctx.createOscillator()
      const gain3 = this.ctx.createGain()
      osc3.type = 'triangle'
      osc3.frequency.setValueAtTime(fund * 0.5, now)
      gain3.gain.setValueAtTime(0.001, now)
      gain3.gain.linearRampToValueAtTime(0.12, now + 0.06)
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 2.8)

      osc1.connect(gain1)
      gain1.connect(this.sfxGain)
      osc2.connect(gain2)
      gain2.connect(this.sfxGain)
      osc3.connect(gain3)
      gain3.connect(this.sfxGain)

      osc1.start(now)
      osc2.start(now)
      osc3.start(now)
      osc1.stop(now + 3.5)
      osc2.stop(now + 2.5)
      osc3.stop(now + 3.0)

      // Safe physical haptics on touch devices only
      if (typeof window !== 'undefined' && 'ontouchstart' in window && navigator.vibrate) {
        try {
          navigator.vibrate([15, 30, 20])
        } catch {}
      }
    } catch {}
  }

  // Resonant glass chime when hovering panels
  playGlassChime(projectIndex = 0) {
    try {
      if (!this.isInitialized || this.isMuted || !this.ctx || !this.sfxGain) return
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      const now = this.ctx.currentTime
      const freq = this.chimeFrequencies[projectIndex % this.chimeFrequencies.length]

      // Fundamental glass tone (Sine with fast harmonic decay)
      const osc = this.ctx.createOscillator()
      const harmonicOsc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const bandpass = this.ctx.createBiquadFilter()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now)

      harmonicOsc.type = 'sine'
      harmonicOsc.frequency.setValueAtTime(freq * 2.76, now)

      bandpass.type = 'bandpass'
      bandpass.frequency.setValueAtTime(freq * 1.5, now)
      bandpass.Q.setValueAtTime(4.0, now)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2)

      osc.connect(gain)
      harmonicOsc.connect(gain)
      gain.connect(this.sfxGain)

      osc.start(now)
      harmonicOsc.start(now)
      osc.stop(now + 1.25)
      harmonicOsc.stop(now + 1.25)
    } catch {}
  }

  // Tactile click / shutter sound when selecting or switching views
  playTactileClick(type = 'select') {
    try {
      if (!this.isInitialized || this.isMuted || !this.ctx || !this.sfxGain) return
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {})
      }

      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      if (type === 'select') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(880, now)
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08)

        gain.gain.setValueAtTime(0.2, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
      } else if (type === 'view') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, now)
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.06)

        gain.gain.setValueAtTime(0.15, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      } else {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1)

        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
      }

      osc.connect(gain)
      gain.connect(this.sfxGain)

      osc.start(now)
      osc.stop(now + 0.15)
    } catch {}
  }

  toggleMute() {
    if (!this.isInitialized) {
      this.init()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    this.isMuted = !this.isMuted
    const targetGain = this.isMuted ? 0 : 0.8
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.4)
    }

    if (!this.isMuted) {
      this.playTactileClick('view')
    }

    return !this.isMuted
  }

  getFrequencyData() {
    if (!this.analyser || this.isMuted) return null
    this.analyser.getByteFrequencyData(this.dataArray)
    return this.dataArray
  }
}

export const soundscape = new SoundscapeEngine()
