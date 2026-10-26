import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { soundscape } from '../utils/audio.js'

export default function Intro({ visible, onEnter }) {
  const ref      = useRef(null)
  useEffect(() => {
    if (!ref.current) return

    if (visible) {
      ref.current.style.display = 'flex'
      ref.current.style.visibility = 'visible'
      ref.current.style.pointerEvents = 'auto'
      const content = ref.current.querySelector('.intro-content')
      if (content) content.style.pointerEvents = 'auto'

      gsap.killTweensOf(ref.current)
      gsap.to(ref.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
      })

      const els = ref.current.querySelectorAll('.intro-el')
      gsap.killTweensOf(els)
      gsap.fromTo(
        els,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.15,
        }
      )
    } else {
      gsap.killTweensOf(ref.current)
      ref.current.style.pointerEvents = 'none'
      const content = ref.current.querySelector('.intro-content')
      if (content) content.style.pointerEvents = 'none'

      gsap.to(ref.current, {
        opacity: 0,
        y: -24,
        scale: 0.98,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          if (ref.current) {
            ref.current.style.display = 'none'
            ref.current.style.visibility = 'hidden'
          }
        },
      })
    }
  }, [visible])

  // Allow Enter key to quickly enter the sanctuary
  useEffect(() => {
    if (!visible) return
    const onKey = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleEnterClick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  const btnRef = useRef(null)
  const targetTilt = useRef({ x: 0, y: 0, glareX: 50, glareY: 50, isHovered: false })
  const currentTilt = useRef({ x: 0, y: 0, glareX: 50, glareY: 50 })
  const rafTilt = useRef(null)

  // ── High-Precision 3D Tilt Physics with Spring Damping (Sleeping RAF when idle) ──
  useEffect(() => {
    if (!visible) {
      if (rafTilt.current) {
        cancelAnimationFrame(rafTilt.current)
        rafTilt.current = null
      }
      return
    }

    const btn = btnRef.current
    if (!btn) return

    const startLoop = () => {
      if (!rafTilt.current) {
        rafTilt.current = requestAnimationFrame(loop)
      }
    }

    const handleMouseMove = (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const normX = (x / rect.width - 0.5) * 2
      const normY = (y / rect.height - 0.5) * 2

      targetTilt.current.x = -normY * 18
      targetTilt.current.y = normX * 22
      targetTilt.current.glareX = (x / rect.width) * 100
      targetTilt.current.glareY = (y / rect.height) * 100
      targetTilt.current.isHovered = true
      startLoop()
    }

    const handleMouseEnter = () => {
      targetTilt.current.isHovered = true
      try {
        soundscape.playTick()
      } catch {}
      startLoop()
    }

    const handleMouseLeave = () => {
      targetTilt.current.isHovered = false
      targetTilt.current.x = 0
      targetTilt.current.y = 0
      targetTilt.current.glareX = 50
      targetTilt.current.glareY = 50
      startLoop()
    }

    btn.addEventListener('mousemove', handleMouseMove, { passive: true })
    btn.addEventListener('mouseenter', handleMouseEnter, { passive: true })
    btn.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    const loop = () => {
      const ease = targetTilt.current.isHovered ? 0.18 : 0.12
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * ease
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * ease
      currentTilt.current.glareX += (targetTilt.current.glareX - currentTilt.current.glareX) * ease
      currentTilt.current.glareY += (targetTilt.current.glareY - currentTilt.current.glareY) * ease

      const rotX = currentTilt.current.x.toFixed(2)
      const rotY = currentTilt.current.y.toFixed(2)
      const gX = currentTilt.current.glareX.toFixed(1)
      const gY = currentTilt.current.glareY.toFixed(1)
      const zLift = targetTilt.current.isHovered ? 22 : 0

      btn.style.setProperty('--btn-rot-x', `${rotX}deg`)
      btn.style.setProperty('--btn-rot-y', `${rotY}deg`)
      btn.style.setProperty('--btn-z-lift', `${zLift}px`)
      btn.style.setProperty('--glare-x', `${gX}%`)
      btn.style.setProperty('--glare-y', `${gY}%`)

      if (!targetTilt.current.isHovered && Math.abs(currentTilt.current.x) < 0.05 && Math.abs(currentTilt.current.y) < 0.05) {
        currentTilt.current.x = 0
        currentTilt.current.y = 0
        btn.style.setProperty('--btn-rot-x', '0deg')
        btn.style.setProperty('--btn-rot-y', '0deg')
        btn.style.setProperty('--btn-z-lift', '0px')
        rafTilt.current = null
        return
      }

      rafTilt.current = requestAnimationFrame(loop)
    }

    return () => {
      btn.removeEventListener('mousemove', handleMouseMove)
      btn.removeEventListener('mouseenter', handleMouseEnter)
      btn.removeEventListener('mouseleave', handleMouseLeave)
      if (rafTilt.current) {
        cancelAnimationFrame(rafTilt.current)
        rafTilt.current = null
      }
    }
  }, [visible])

  const handleEnterClick = () => {
    try {
      soundscape.init()
      soundscape.playSanctuaryChime()
      soundscape.playTactileClick('select')
    } catch {}
    if (onEnter) onEnter()
  }

  return (
    <div
      className={`intro-overlay ${!visible ? 'hidden' : ''}`}
      ref={ref}
      onClick={() => handleEnterClick()}
      style={{
        pointerEvents: visible ? 'auto' : 'none',
        visibility: visible ? 'visible' : 'hidden',
        cursor: 'pointer',
      }}
      aria-label="Sami Khan Studio Sanctuary Entrance"
      aria-hidden={!visible}
    >
      <div className="intro-content">
        <div className="intro-el intro-rule" aria-hidden="true" />
        <div className="intro-el intro-badge-row">
          <span className="intro-badge">Monograph Archive</span>
          <span className="intro-dot">◆</span>
          <span className="intro-badge">Kyoto Sanctuary</span>
          <span className="intro-dot">◆</span>
          <span className="intro-badge">佐美館</span>
        </div>
        <h1 className="intro-el intro-headline">
          SAMI KHAN
        </h1>
        <p className="intro-el intro-sub">
          The personal spatial monograph of Sami Khan. An exploration of code, light, charred cedar, and sacred Kyoto architecture after dark.
        </p>
        <div className="intro-el intro-action-row">
          <div className="btn-3d-wrapper">
            {/* Recessed Architectural Console Socket */}
            <div className="btn-3d-socket" aria-hidden="true" />

            {/* Outer ambient golden sanctuary aura */}
            <div className="btn-3d-aura" aria-hidden="true" />

            {/* 3D Interactive Gyroscopic Button */}
            <button
              ref={btnRef}
              className="btn-enter-archive"
              onClick={handleEnterClick}
              aria-label="Enter Sanctuary"
            >
              {/* 3D Extruded Pedestal Base */}
              <span className="btn-3d-pedestal" aria-hidden="true" />

              {/* Internal Sacred Core Ember Glow */}
              <span className="btn-3d-core-glow" aria-hidden="true" />

              {/* Dynamic Mouse Glare Layer */}
              <span className="btn-3d-glare" aria-hidden="true" />

              {/* Continuous Prismatic Light Sweep */}
              <span className="btn-3d-shimmer" aria-hidden="true" />

              {/* Floating 3D Foreground Elements with stereoscopic parallax */}
              <span className="btn-3d-content">
                <span className="btn-3d-jewel" aria-hidden="true">
                  <span className="jewel-dot" />
                </span>
                <span className="btn-3d-text">Enter Sanctuary</span>
                <span className="btn-arrow" aria-hidden="true">→</span>
              </span>
            </button>
          </div>

          <div
            className="intro-scroll-hint"
            onClick={handleEnterClick}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label="Enter Sanctuary"
          >
            <span className="intro-scroll-dot" />
            <span>Scroll or click to explore archive</span>
          </div>
        </div>
      </div>
    </div>
  )
}
