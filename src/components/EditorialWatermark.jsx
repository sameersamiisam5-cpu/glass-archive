import { useEffect, useRef, useState } from 'react'
import { projects } from '../data/projects.js'
import { soundscape } from '../utils/audio.js'

export default function EditorialWatermark({
  activeIndex = 0,
  scrollStateRef,
  selectedProject,
  onProjectClick,
  introVisible = false,
  viewMode = 'corridor',
  onJumpToProject,
}) {
  const containerRef = useRef(null)
  const orbitTrackRef = useRef(null)
  const titleLayersRef = useRef([])
  const kanjiLayersRef = useRef([])

  const mousePos = useRef({ x: 0, y: 0 })
  const smoothMouse = useRef({ x: 0, y: 0 })
  const smoothTrackRef = useRef(activeIndex)
  const lastChimedIdx = useRef(activeIndex)
  const [activeIdx, setActiveIdx] = useState(activeIndex)

  const isOrbit = viewMode === 'orbit'
  const viewModeRef = useRef(viewMode)
  viewModeRef.current = viewMode

  // Keep activeIdx synchronized with activeIndex prop
  useEffect(() => {
    setActiveIdx(activeIndex)
  }, [activeIndex])

  // When switching between corridor and orbit, reset inline corridor culling
  useEffect(() => {
    if (viewMode === 'orbit') {
      projects.forEach((_, i) => {
        if (titleLayersRef.current[i]) {
          titleLayersRef.current[i].style.opacity = '0'
          titleLayersRef.current[i].style.display = 'none'
        }
        if (kanjiLayersRef.current[i]) {
          kanjiLayersRef.current[i].style.opacity = '0'
          kanjiLayersRef.current[i].style.display = 'none'
        }
      })
    }
  }, [viewMode])

  // ── Passive Smooth Mouse Parallax ──────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e) => {
      mousePos.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mousePos.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  const isHidden = (selectedProject !== null && selectedProject !== undefined) || introVisible
  const isHiddenRef = useRef(isHidden)
  isHiddenRef.current = isHidden

  // ── High-Performance Direct DOM Interpolation Loop (Sleeps when occluded) ──
  useEffect(() => {
    if (isHidden) return

    let rafId = null
    const total = projects.length

    const applyLayerStyle = (el, idx, curTrack, driftY) => {
      if (!el) return
      const d = curTrack - idx
      const absD = Math.abs(d)
      const dwell = 0.25
      const corridor = 0.50
      const maxRange = dwell + corridor

      if (absD >= maxRange) {
        if (el.style.display !== 'none') {
          el.style.display = 'none'
          el.style.opacity = '0'
        }
        return
      }

      const progress = absD <= dwell ? 0 : (absD - dwell) / corridor
      const fade = absD <= dwell ? 1.0 : (1 + Math.cos(progress * Math.PI)) * 0.5
      const y = -d * driftY
      const scale = 1.0 - progress * 0.025
      const opacity = Math.max(0, Math.min(1, fade))

      if (el.style.display !== 'block') el.style.display = 'block'
      el.style.opacity = opacity.toFixed(3)
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`
    }

    const tick = () => {
      if (isHiddenRef.current || document.hidden) {
        rafId = null
        return
      }

      const targetProgress = scrollStateRef?.current?.progress ?? 0
      const velocity = scrollStateRef?.current?.velocity ?? 0
      const targetTrack = targetProgress * (total - 1)

      // Silky cinematic inertia in lockstep with UI
      smoothTrackRef.current += (targetTrack - smoothTrackRef.current) * 0.18
      const curTrack = smoothTrackRef.current

      // Mouse smoothing
      smoothMouse.current.x += (mousePos.current.x - smoothMouse.current.x) * 0.06
      smoothMouse.current.y += (mousePos.current.y - smoothMouse.current.y) * 0.06

      if (containerRef.current) {
        const xOff = smoothMouse.current.x * -14
        const yOff = smoothMouse.current.y * -10
        containerRef.current.style.transform = `translate3d(${xOff.toFixed(1)}px, ${yOff.toFixed(1)}px, 0)`
      }

      if (viewModeRef.current === 'orbit') {
        // In 3D Orbit mode: apply real-time interactive 3D projectile curve tilt
        if (orbitTrackRef.current) {
          const rotY = smoothMouse.current.x * 14
          const rotX = -smoothMouse.current.y * 9
          orbitTrackRef.current.style.transform = `rotateY(${rotY.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`
        }
      } else {
        // In Corridor mode: update layers directly on DOM (0 React re-renders during active scrolling)
        for (let i = 0; i < total; i++) {
          applyLayerStyle(titleLayersRef.current[i], i, curTrack, 16)
          applyLayerStyle(kanjiLayersRef.current[i], i, curTrack, 20)
        }
      }

      // Sync active project on crossing project threshold without triggering double soundscape chime
      const closestIdx = Math.min(total - 1, Math.max(0, Math.round(curTrack)))
      if (closestIdx !== lastChimedIdx.current && Math.abs(velocity) > 0.001) {
        lastChimedIdx.current = closestIdx
        setActiveIdx(closestIdx)
      }

      rafId = requestAnimationFrame(tick)
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      } else if (!isHiddenRef.current && !rafId) {
        rafId = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    rafId = requestAnimationFrame(tick)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isHidden, scrollStateRef])

  const activeProject = projects[activeIdx] || projects[0]

  return (
    <div
      className={`editorial-watermark-plane ${isHidden ? 'watermark-hidden' : ''} ${isOrbit ? 'mode-orbit' : 'mode-corridor'}`}
      aria-label="Interactive Typographic Exhibit"
    >
      <div className="watermark-parallax-wrap" ref={containerRef}>
        {/* ── Central Stage Hitbox: Clicking anywhere in corridor opens active project ── */}
        {!isOrbit && (
          <div
            className="watermark-stage-hitbox"
            onClick={() => onProjectClick?.(activeIndex)}
            title={`View Specimen: ${activeProject.title}`}
            role="button"
            tabIndex={0}
            aria-label={`View Specimen: ${activeProject.title}`}
          />
        )}

        {/* ── 1. Roman Title Slot (Corridor Mode) ── */}
        <div
          className={`watermark-anim watermark-title-slot ${isOrbit ? 'orbit-faded' : ''}`}
          onClick={() => onProjectClick?.(activeIndex)}
          title={`View ${activeProject.title}`}
          role="button"
          tabIndex={isOrbit ? -1 : 0}
        >
          {projects.map((p, idx) => (
            <div
              key={p.id}
              ref={(el) => (titleLayersRef.current[idx] = el)}
              className="morph-layer morph-title"
              style={{
                display: idx === activeIndex && !isOrbit ? 'block' : 'none',
                opacity: idx === activeIndex && !isOrbit ? 1 : 0,
                willChange: 'transform, opacity',
              }}
            >
              {p.title}
            </div>
          ))}
        </div>

        {/* ── 2. Colossal Japanese Big Title (Corridor Mode) ── */}
        <div
          className={`watermark-anim watermark-kanji-slot ${isOrbit ? 'orbit-faded' : ''}`}
          onClick={() => onProjectClick?.(activeIndex)}
          title={`View ${activeProject.title}`}
          role="button"
          tabIndex={isOrbit ? -1 : 0}
        >
          {projects.map((p, idx) => (
            <div
              key={p.id}
              ref={(el) => (kanjiLayersRef.current[idx] = el)}
              className="morph-layer morph-kanji"
              style={{
                display: idx === activeIndex && !isOrbit ? 'block' : 'none',
                opacity: idx === activeIndex && !isOrbit ? 1 : 0,
                willChange: 'transform, opacity',
              }}
            >
              {p.kanjiHero}
            </div>
          ))}
        </div>

        {/* ── 3. 3D Projectile Orbital Formation (5 Giant Japanese Section Texts in Curved Arc) ── */}
        <div
          className={`watermark-orbit-stage ${isOrbit ? 'orbit-active' : ''}`}
          aria-hidden={!isOrbit}
        >
          {/* Orbital Celestial HUD Chip */}
          <div className="orbit-celestial-hud" aria-hidden="true">
            <div className="orbit-hud-chip">
              <span className="orbit-hud-crest">軌</span>
              <span className="orbit-hud-label">KYOTO 3D ORBIT · 洛中軌道図</span>
              <span className="orbit-hud-sub">SELECT ANY SPECIMEN TO ENGAGE</span>
            </div>
          </div>

          <div className="orbit-projectile-track" ref={orbitTrackRef}>
            {projects.map((p, idx) => {
              const isActive = idx === activeIndex
              return (
                <div
                  key={p.id}
                  data-idx={idx}
                  className={`orbit-projectile-card ${isActive ? 'is-active-specimen' : ''}`}
                  onClick={() => {
                    if (idx !== activeIndex) {
                      onJumpToProject?.(idx)
                      soundscape.playGlassChime(idx)
                    } else {
                      onProjectClick?.(idx)
                      soundscape.playTactileClick('select')
                    }
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  role="button"
                  tabIndex={isOrbit ? 0 : -1}
                  title={`Specimen ${p.number}: ${p.title} (${p.japaneseTitle})`}
                  aria-label={`Specimen ${p.number}: ${p.title}`}
                >
                  {/* Glowing 3D Specimen Aura */}
                  <div className="orbit-card-aura" aria-hidden="true" />

                  {/* Colossal 3D Japanese Section Text */}
                  <div className="orbit-giant-kanji">
                    {p.kanjiHero}
                  </div>

                  {/* Floating Specimen Hologram Cartouche */}
                  <div className="orbit-specimen-cartouche">
                    <span className="orbit-cartouche-vol">巻之{p.number}</span>
                    <span className="orbit-cartouche-sep">◆</span>
                    <span className="orbit-cartouche-title">{p.title}</span>
                    {isActive && <span className="orbit-active-pill">ACTIVE · 鑑賞</span>}
                  </div>

                  {/* Ground Trajectory Node Line */}
                  <div className="orbit-trajectory-node" aria-hidden="true" />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
