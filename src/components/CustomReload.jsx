import { useEffect, useState, useRef } from 'react'
import { soundscape } from '../utils/audio.js'

export default function CustomReload({
  isOpen,
  onComplete,
  onHardReload,
}) {
  const [percent, setPercent] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [isClosing, setIsClosing] = useState(false)
  const timerRef = useRef(null)

  const phases = [
    'Calibrating Kyoto coordinate space...',
    'Synthesizing optical glass shaders...',
    'Harmonizing acoustic frequency bus...',
    'Sanctuary Restored · 浄化完了',
  ]

  useEffect(() => {
    if (!isOpen) {
      setPercent(0)
      setPhaseIndex(0)
      setIsClosing(false)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    try {
      soundscape.playSanctuaryChime()
    } catch {}

    setPercent(0)
    setPhaseIndex(0)
    setIsClosing(false)

    const startTime = Date.now()
    const duration = 2100 // 2.1s luxury cinematic sequence

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const rawProgress = Math.min(elapsed / duration, 1)

      // Smooth cubic ease out
      const eased = 1 - Math.pow(1 - rawProgress, 2.5)
      const currentPct = Math.round(eased * 100)
      setPercent(currentPct)

      if (rawProgress < 0.3) {
        setPhaseIndex(0)
      } else if (rawProgress < 0.65) {
        setPhaseIndex(1)
      } else if (rawProgress < 0.95) {
        setPhaseIndex(2)
      } else {
        setPhaseIndex(3)
      }

      if (rawProgress >= 1) {
        clearInterval(timerRef.current)
        setIsClosing(true)
        setTimeout(() => {
          onComplete?.()
        }, 600)
      }
    }, 24)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isOpen, onComplete])

  if (!isOpen && !isClosing) return null

  // SVG circular progress calculation
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div
      className={`custom-reload-overlay ${isClosing ? 'reload-closing' : 'reload-entering'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Reload Sanctuary Archive"
    >
      <div className="reload-backdrop" />

      {/* ── Central Ritual Altar ── */}
      <div className="reload-card">
        {/* Animated Concentric Zen Rings & Progress */}
        <div className="reload-zen-container">
          <svg className="reload-svg-ring" width="140" height="140" viewBox="0 0 140 140">
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="reload-ring-bg"
            />
            {/* Liquid Gold Progress Stroke */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              className="reload-ring-progress"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
              }}
            />
          </svg>

          {/* Central Cinnabar Hanko Seal */}
          <div className="reload-seal-core" title="浄化 · Sanctuary Renewal">
            <span className="reload-seal-kanji">浄化</span>
            <div className="reload-seal-glow" />
          </div>
        </div>

        {/* ── Monograph Provenance Headline ── */}
        <div className="reload-header">
          <div className="reload-badge-row">
            <span className="reload-badge">Kyoto Sanctuary</span>
            <span className="reload-dot">·</span>
            <span className="reload-badge">再読込</span>
            <span className="reload-dot">·</span>
            <span className="reload-badge">2026</span>
          </div>
          <h2 className="reload-title">RE-INITIALIZING ARCHIVE</h2>
          <p className="reload-status-text">
            {phases[phaseIndex]}
          </p>
        </div>

        {/* ── Numeric Readout ── */}
        <div className="reload-metric-row">
          <div className="reload-progress-bar-track">
            <div
              className="reload-progress-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="reload-digits">
            <span className="reload-digits-num">{String(percent).padStart(3, '0')}</span>
            <span className="reload-digits-pct">%</span>
          </div>
        </div>

        {/* ── Alternate Options (Hard Reload / Skip) ── */}
        <div className="reload-actions">
          <button
            className="reload-btn-action reload-btn-hard"
            onClick={onHardReload}
            title="Perform browser hard reload"
          >
            <span>Full Browser Reload</span>
            <span className="reload-btn-icon">↵</span>
          </button>
        </div>
      </div>
    </div>
  )
}
