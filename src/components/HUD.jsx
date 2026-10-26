import { useEffect, useState, useRef } from 'react'
import { soundscape } from '../utils/audio.js'
import { projects } from '../data/projects.js'

export default function HUD({
  activeIndex,
  scrollStateRef,
  viewMode,
  onViewModeChange,
  onJumpToProject,
  onScrub,
  selectedProject,
  onOpenIndex,
  onReload,
  introVisible = false,
}) {
  const [isAudioActive, setIsAudioActive] = useState(false)
  const [kyotoTime, setKyotoTime] = useState('')
  const eqCanvasRef = useRef(null)
  const navRef = useRef(null)
  const navTargetTilt = useRef({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false })
  const navCurrentTilt = useRef({ x: 0, y: 0, glareX: 50, glareY: 50 })
  const rafNav = useRef(null)

  // Direct 60fps/120fps RAF DOM refs for instant scroll tracking
  const scrubTrackRef = useRef(null)
  const scrubInnerRef = useRef(null)
  const ticksContainerRef = useRef(null)
  const beamRef = useRef(null)
  const needleRef = useRef(null)
  const curProgressRef = useRef(scrollStateRef?.current?.progress || 0)
  const activeSecIdxRef = useRef(activeIndex || 0)
  const isScrubbingRef = useRef(false)

  // ── High-Precision 3D Tilt Physics for Navigation Capsule ──────────────────
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const startLoop = () => {
      if (!rafNav.current) {
        rafNav.current = requestAnimationFrame(loop)
      }
    }

    const handleMouseMove = (e) => {
      const rect = nav.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotY = ((x - centerX) / centerX) * 8
      const rotX = -((y - centerY) / centerY) * 7

      navTargetTilt.current.x = rotX
      navTargetTilt.current.y = rotY
      navTargetTilt.current.glareX = (x / rect.width) * 100
      navTargetTilt.current.glareY = (y / rect.height) * 100
      navTargetTilt.current.isHovered = true
      startLoop()
    }

    const handleMouseLeave = () => {
      navTargetTilt.current.isHovered = false
      navTargetTilt.current.x = 0
      navTargetTilt.current.y = 0
      navTargetTilt.current.glareX = 50
      navTargetTilt.current.glareY = 50
      startLoop()
    }

    nav.addEventListener('mousemove', handleMouseMove, { passive: true })
    nav.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    const loop = () => {
      const ease = navTargetTilt.current.isHovered ? 0.16 : 0.10
      navCurrentTilt.current.x += (navTargetTilt.current.x - navCurrentTilt.current.x) * ease
      navCurrentTilt.current.y += (navTargetTilt.current.y - navCurrentTilt.current.y) * ease
      navCurrentTilt.current.glareX += (navTargetTilt.current.glareX - navCurrentTilt.current.glareX) * ease
      navCurrentTilt.current.glareY += (navTargetTilt.current.glareY - navCurrentTilt.current.glareY) * ease

      const rotX = navCurrentTilt.current.x.toFixed(2)
      const rotY = navCurrentTilt.current.y.toFixed(2)
      const gX = navCurrentTilt.current.glareX.toFixed(1)
      const gY = navCurrentTilt.current.glareY.toFixed(1)
      const zLift = navTargetTilt.current.isHovered ? 10 : 0

      nav.style.setProperty('--nav-rot-x', `${rotX}deg`)
      nav.style.setProperty('--nav-rot-y', `${rotY}deg`)
      nav.style.setProperty('--nav-z-lift', `${zLift}px`)
      nav.style.setProperty('--nav-glare-x', `${gX}%`)
      nav.style.setProperty('--nav-glare-y', `${gY}%`)

      if (!navTargetTilt.current.isHovered && Math.abs(navCurrentTilt.current.x) < 0.05 && Math.abs(navCurrentTilt.current.y) < 0.05) {
        navCurrentTilt.current.x = 0
        navCurrentTilt.current.y = 0
        nav.style.setProperty('--nav-rot-x', '0deg')
        nav.style.setProperty('--nav-rot-y', '0deg')
        nav.style.setProperty('--nav-z-lift', '0px')
        rafNav.current = null
        return
      }

      rafNav.current = requestAnimationFrame(loop)
    }

    return () => {
      nav.removeEventListener('mousemove', handleMouseMove)
      nav.removeEventListener('mouseleave', handleMouseLeave)
      if (rafNav.current) cancelAnimationFrame(rafNav.current)
    }
  }, [])

  // ── Real-Time RAF Loop for Scrubber Progress (Sleeps when modal is open) ──
  useEffect(() => {
    if (selectedProject !== null) return
    let rafId = null

    const tick = () => {
      if (document.hidden) {
        rafId = null
        return
      }

      // If currently dragging, allow the drag handler to set progress
      if (!isScrubbingRef.current) {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const nativeProgress = window.scrollY / maxScroll
        const targetProgress = typeof scrollStateRef?.current?.progress === 'number'
          ? scrollStateRef.current.progress
          : nativeProgress

        // Lockstep tracking — perfectly follows the scroll position without latency
        curProgressRef.current = targetProgress
        const p = Math.min(1, Math.max(0, curProgressRef.current))
        const pct = p * 100

        if (beamRef.current) {
          beamRef.current.style.width = `${pct.toFixed(2)}%`
        }
        if (needleRef.current) {
          needleRef.current.style.left = `${pct.toFixed(2)}%`
        }

        // Live update active section tick markers in real-time
        const curIdx = Math.min(
          projects.length - 1,
          Math.max(0, Math.round(p * (projects.length - 1)))
        )
        if (curIdx !== activeSecIdxRef.current) {
          activeSecIdxRef.current = curIdx
          if (ticksContainerRef.current) {
            const ticks = ticksContainerRef.current.children
            for (let i = 0; i < ticks.length; i++) {
              if (i === curIdx) ticks[i].classList.add('active')
              else ticks[i].classList.remove('active')
            }
          }
        }
      }

      rafId = requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      } else if (!rafId && selectedProject === null) {
        rafId = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    rafId = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [scrollStateRef, selectedProject])

  // ── Scrubber Pointer Scrubbing Interaction ────────────────────────────────
  const handleScrubPointer = (e) => {
    const inner = scrubInnerRef.current || scrubTrackRef.current
    if (!inner) return
    const rect = inner.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    curProgressRef.current = progress
    const pct = progress * 100

    if (beamRef.current) beamRef.current.style.width = `${pct.toFixed(2)}%`
    if (needleRef.current) needleRef.current.style.left = `${pct.toFixed(2)}%`

    const curIdx = Math.min(
      projects.length - 1,
      Math.max(0, Math.round(progress * (projects.length - 1)))
    )
    if (curIdx !== activeSecIdxRef.current) {
      activeSecIdxRef.current = curIdx
      if (ticksContainerRef.current) {
        const ticks = ticksContainerRef.current.children
        for (let i = 0; i < ticks.length; i++) {
          if (i === curIdx) ticks[i].classList.add('active')
          else ticks[i].classList.remove('active')
        }
      }
    }

    onScrub?.(progress)
  }

  const handleScrubPointerDown = (e) => {
    isScrubbingRef.current = true
    handleScrubPointer(e)
    soundscape.playTactileClick('view')
  }

  useEffect(() => {
    const handleMove = (e) => {
      if (!isScrubbingRef.current) return
      handleScrubPointer(e)
    }
    const handleUp = () => {
      isScrubbingRef.current = false
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [onScrub])

  // Live Kyoto Sanctuary Time (Asia/Tokyo)
  useEffect(() => {
    const updateTime = () => {
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Tokyo',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date())
        setKyotoTime(`Kyoto · ${timeStr}`)
      } catch {
        setKyotoTime('Kyoto')
      }
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Toggle Audio
  const handleToggleAudio = () => {
    const active = soundscape.toggleMute()
    setIsAudioActive(active)
  }

  // Real-time Audio EQ Visualizer Canvas
  useEffect(() => {
    const canvas = eqCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId = null

    const drawEQ = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barCount = 4
      const barWidth = 2.5
      const barGap = 2

      if (!isAudioActive) {
        ctx.fillStyle = 'rgba(180, 195, 215, 0.3)'
        for (let i = 0; i < barCount; i++) {
          ctx.fillRect(i * (barWidth + barGap), canvas.height - 3, barWidth, 3)
        }
        return // Sleep RAF when audio is inactive
      }

      animId = requestAnimationFrame(drawEQ)
      const freqData = soundscape.getFrequencyData()
      ctx.fillStyle = 'rgba(215, 185, 125, 0.85)'

      for (let i = 0; i < barCount; i++) {
        const val = freqData ? freqData[i * 4] / 255 : Math.random() * 0.4 + 0.2
        const h = Math.max(3, val * canvas.height)
        ctx.fillRect(i * (barWidth + barGap), canvas.height - h, barWidth, h)
      }
    }

    drawEQ()
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [isAudioActive])

  const isHidden = selectedProject !== null
  const currentProject = projects[activeIndex] || projects[0]
  const initialProgress = typeof scrollStateRef?.current?.progress === 'number'
    ? scrollStateRef.current.progress
    : (activeIndex / (projects.length - 1))
  const scrollPct = Math.min(100, Math.max(0, initialProgress * 100))

  return (
    <div className={`hud-root ${isHidden ? 'hud-hidden' : ''}`}>
      {/* ── Top Header Bar ── */}
      <header className="hud-top" role="banner">
        {/* Left: Brand & Collection Link */}
        <div className="hud-brand-group">
          <button
            className="hud-brand-btn"
            onClick={onOpenIndex}
            onMouseEnter={() => soundscape.playTick()}
            title="View Index"
          >
            <span className="hud-brand-dot" aria-hidden="true" />
            <span className="hud-brand-title">SAMI KHAN</span>
          </button>
        </div>

        {/* Center: 3D Architectural View Switcher Capsule */}
        <div className="hud-nav-3d-wrapper">
          <div className="hud-nav-socket" aria-hidden="true" />
          <div className="hud-nav-aura" aria-hidden="true" />

          <nav
            ref={navRef}
            className="hud-view-modes"
            aria-label="Scene View Modes"
          >
            {/* 3D Extruded Bevel Pedestal Rim */}
            <span className="hud-nav-pedestal" aria-hidden="true" />

            {/* Specular Dynamic Glare Flare */}
            <span className="hud-nav-glare" aria-hidden="true" />

            {/* Prismatic Shimmer Sheen */}
            <span className="hud-nav-shimmer" aria-hidden="true" />

            {/* Elevated 3D Switch Pills */}
            <div className="hud-nav-pills">
              {['Corridor', 'Orbit', 'Index'].map((mode) => (
                <button
                  key={mode}
                  className={`view-mode-pill ${
                    (mode === 'Index' && false) || viewMode === mode.toLowerCase() ? 'active' : ''
                  }`}
                  onClick={() => {
                    if (mode === 'Index') {
                      onOpenIndex()
                    } else {
                      onViewModeChange(mode.toLowerCase())
                    }
                    soundscape.playTactileClick('view')
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  aria-label={`Switch to ${mode}`}
                >
                  <span className="pill-text">{mode}</span>
                  {((mode === 'Index' && false) || viewMode === mode.toLowerCase()) && (
                    <span className="pill-active-glow" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>

        {/* Right: Kyoto Local Time & Soundscape & Reload */}
        <div className="hud-controls-right">
          <div className="hud-time-display" aria-label="Kyoto local time">
            <span className="hud-time-label">{kyotoTime}</span>
          </div>

          <button
            className="hud-reload-btn"
            onClick={onReload}
            onMouseEnter={() => soundscape.playTick()}
            aria-label="Reload Sanctuary Archive [R]"
            title="Reload Sanctuary [R]"
          >
            <span className="hud-reload-icon">↻</span>
            <span className="hud-reload-text">Reload</span>
          </button>

          <button
            className={`hud-audio-btn ${isAudioActive ? 'active' : ''}`}
            onClick={handleToggleAudio}
            onMouseEnter={() => soundscape.playTick()}
            aria-label={isAudioActive ? 'Mute ambient soundscape' : 'Enable ambient soundscape'}
            title={isAudioActive ? 'Mute Soundscape [M]' : 'Unmute Soundscape [M]'}
          >
            <canvas ref={eqCanvasRef} width={20} height={12} className="hud-eq-canvas" />
            <span className="hud-audio-text">{isAudioActive ? 'Sound' : 'Muted'}</span>
          </button>
        </div>
      </header>

      {/* ── Bottom 3D Tactile Timeline & Scrubber Bar Following Scroll Sections ── */}
      <footer
        className={`hud-bottom ${introVisible ? 'hud-bottom-hidden' : ''}`}
        role="navigation"
        aria-label="Sanctuary navigation track"
      >
        <div className="hud-timeline-monolith">
          <div className="hud-scrubber-channel-wrap">
            {/* 3D Scrubber Track Groove */}
            <div
              className="hud-3d-scrub-track"
              ref={scrubTrackRef}
              onMouseDown={handleScrubPointerDown}
              onTouchStart={handleScrubPointerDown}
              title="Click or drag along the groove to scrub through sections"
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(scrollPct)}
              aria-label="3D timeline scrubber track"
            >
              <div className="hud-scrub-track-inner" ref={scrubInnerRef}>
                {/* Recessed physical groove */}
                <div className="scrub-groove-recess" />

                {/* Liquid gold progress beam driven directly by RAF */}
                <div
                  ref={beamRef}
                  className="scrub-groove-beam"
                  style={{ width: `${scrollPct}%` }}
                />

                {/* Subtle Section Ticks on the bar: 01, 02, 03, 04, 05 */}
                <div className="scrub-section-markers" ref={ticksContainerRef} aria-hidden="true">
                  {projects.map((p, idx) => {
                    const sectionPct = (idx / (projects.length - 1)) * 100
                    const isCurrent = activeIndex === idx
                    return (
                      <div
                        key={p.id}
                        className={`scrub-section-tick ${isCurrent ? 'active' : ''}`}
                        style={{ left: `${sectionPct}%` }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onJumpToProject?.(idx)
                          soundscape.playGlassChime(idx)
                        }}
                        title={`Jump to Section ${p.number}: ${p.title}`}
                      >
                        <span className="tick-notch" />
                        <span className="tick-label">{p.number}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Physical 3D brass needle cursor driven directly by RAF */}
                <div
                  ref={needleRef}
                  className="scrub-3d-needle"
                  style={{ left: `${scrollPct}%` }}
                >
                  <span className="needle-gem" />
                  <span className="needle-body" />
                  <span className="needle-beam-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
