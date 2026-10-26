import { useEffect, useRef, useState } from 'react'
import { soundscape } from '../utils/audio.js'

export default function CustomCursor({ hoveredIndex, selectedProject, cursorMode }) {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const textRef = useRef(null)
  const labelSpanRef = useRef(null)
  const rippleRef = useRef(null)

  const mousePos = useRef({ x: -100, y: -100 })
  const ringPos = useRef({ x: -100, y: -100 })
  const velocity = useRef({ x: 0, y: 0 })
  const isMouseDown = useRef(false)
  const targetMagnet = useRef(null)
  const lastInteractiveEl = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  const hoveredIndexRef = useRef(hoveredIndex)
  const selectedProjectRef = useRef(selectedProject)
  const cursorModeRef = useRef(cursorMode)
  hoveredIndexRef.current = hoveredIndex
  selectedProjectRef.current = selectedProject
  cursorModeRef.current = cursorMode

  useEffect(() => {
    let rafId = null

    const updateBadgeDirect = (newLabel, isLocked) => {
      if (labelSpanRef.current && labelSpanRef.current.textContent !== newLabel) {
        labelSpanRef.current.textContent = newLabel
      }
      if (ringRef.current) {
        ringRef.current.classList.toggle('active', Boolean(newLabel))
        ringRef.current.classList.toggle('magnetic-locked', Boolean(isLocked))
      }
      if (textRef.current) {
        textRef.current.classList.toggle('visible', Boolean(newLabel))
      }
    }

    const onMouseMove = (e) => {
      if (!isVisible) setIsVisible(true)
      const prevX = mousePos.current.x
      const prevY = mousePos.current.y
      mousePos.current.x = e.clientX
      mousePos.current.y = e.clientY

      const vx = e.clientX - prevX
      const vy = e.clientY - prevY
      velocity.current.x = vx
      velocity.current.y = vy

      // ── Magnetic Target Detection (Zero-Reflow Cached Evaluation) ─────────
      const interactiveEl = e.target.closest(
        'button, a, [role="button"], .specimen-3d-btn, .sanctuary-hanko, .watermark-kanji-slot, .watermark-title-slot, .watermark-stage-hitbox, .hud-btn, .hud-bead, .index-item'
      )

      if (interactiveEl !== lastInteractiveEl.current) {
        lastInteractiveEl.current = interactiveEl

        if (interactiveEl) {
          const rect = interactiveEl.getBoundingClientRect()
          targetMagnet.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            w: rect.width,
            h: rect.height,
          }

          let lbl = 'VIEW'
          if (interactiveEl.closest('.sanctuary-hanko')) lbl = 'SEAL · 印'
          else if (interactiveEl.closest('.specimen-3d-btn')) lbl = 'EXAMINE · 鑑賞'
          else if (interactiveEl.closest('.watermark-kanji-slot')) lbl = 'MONOGRAPH'
          else if (interactiveEl.closest('.watermark-title-slot')) lbl = 'DISCOVER'
          else if (interactiveEl.closest('.btn-enter-archive')) lbl = 'ENTER'
          else if (interactiveEl.closest('.hud-btn, .hud-bead')) lbl = 'NAV'
          else if (interactiveEl.closest('.watermark-stage-hitbox')) lbl = 'VIEW'

          updateBadgeDirect(lbl, true)
        } else {
          targetMagnet.current = null
          let fallback = ''
          if (hoveredIndexRef.current >= 0 && selectedProjectRef.current === null) {
            fallback = 'VIEW'
          } else if (cursorModeRef.current) {
            fallback = cursorModeRef.current
          }
          updateBadgeDirect(fallback, false)
        }
      }
    }

    const onMouseDown = (e) => {
      isMouseDown.current = true
      try {
        soundscape.playTick()
      } catch {}

      if (dotRef.current) dotRef.current.classList.add('cursor-dot-clicking')
      if (ringRef.current) ringRef.current.classList.add('cursor-ring-clicking')

      // Subtle, luxury optical ripple (zero fireworks, pure water/glass refraction)
      if (rippleRef.current) {
        rippleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
        rippleRef.current.classList.remove('ripple-anim')
        void rippleRef.current.offsetWidth // force reflow to restart CSS animation
        rippleRef.current.classList.add('ripple-anim')
      }
    }

    const onMouseUp = () => {
      isMouseDown.current = false
      setTimeout(() => {
        if (dotRef.current) dotRef.current.classList.remove('cursor-dot-clicking')
        if (ringRef.current) ringRef.current.classList.remove('cursor-ring-clicking')
      }, 100)
    }

    const onMouseLeave = () => {
      setIsVisible(false)
      targetMagnet.current = null
      lastInteractiveEl.current = null
      updateBadgeDirect('', false)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown, { passive: true })
    window.addEventListener('mouseup', onMouseUp, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave, { passive: true })

    // ── Ultra-Smooth 60+ FPS RAF Loop ───────────────────────────────────────
    const tick = () => {
      const ease = 0.22
      const magnet = targetMagnet.current

      let targetX = mousePos.current.x
      let targetY = mousePos.current.y

      if (magnet) {
        targetX = magnet.x + (mousePos.current.x - magnet.x) * 0.28
        targetY = magnet.y + (mousePos.current.y - magnet.y) * 0.28
      }

      ringPos.current.x += (targetX - ringPos.current.x) * ease
      ringPos.current.y += (targetY - ringPos.current.y) * ease

      const vx = velocity.current.x
      const vy = velocity.current.y
      const speed = Math.hypot(vx, vy)
      const angle = Math.atan2(vy, vx) * (180 / Math.PI)
      const stretch = magnet ? 0 : Math.min(speed * 0.015, 0.42)

      velocity.current.x *= 0.82
      velocity.current.y *= 0.82

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mousePos.current.x}px, ${mousePos.current.y}px, 0)`
      }

      if (ringRef.current) {
        const isHovering = Boolean(magnet) || hoveredIndexRef.current >= 0 || cursorModeRef.current
        let scaleBase = isHovering ? 1.75 : 1.0
        if (isMouseDown.current) scaleBase *= 0.86

        const scaleX = scaleBase + stretch
        const scaleY = scaleBase - stretch * 0.45
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) rotate(${angle}deg) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)})`
      }

      if (textRef.current) {
        textRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [isVisible])

  return (
    <div
      className={`custom-cursor-container ${isVisible ? 'visible' : ''}`}
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div ref={rippleRef} className="cursor-click-ripple" style={{ pointerEvents: 'none' }} />
      <div ref={dotRef} className="cursor-dot" style={{ pointerEvents: 'none' }} />
      <div ref={ringRef} className="cursor-ring" style={{ pointerEvents: 'none' }} />
      <div ref={textRef} className="cursor-badge" style={{ pointerEvents: 'none' }}>
        <span className="cursor-badge-dot" style={{ pointerEvents: 'none' }} aria-hidden="true" />
        <span ref={labelSpanRef} style={{ pointerEvents: 'none' }} />
      </div>
    </div>
  )
}
