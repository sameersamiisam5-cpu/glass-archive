import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { projects } from '../data/projects.js'
import { soundscape } from '../utils/audio.js'

export default function ProjectUI({
  activeIndex,
  selectedProject,
  hoveredIndex,
  introVisible = false,
  onProjectClick,
}) {
  const project = projects[activeIndex]
  const labelRef = useRef(null)
  const prevIdx = useRef(activeIndex)

  useEffect(() => {
    if (!labelRef.current) return
    if (selectedProject !== null && selectedProject !== undefined) return
    if (introVisible) return
    if (prevIdx.current === activeIndex) return
    prevIdx.current = activeIndex

    // Staggered reveal for general labels
    gsap.fromTo(
      labelRef.current.querySelectorAll('.animate-label:not(.sanctuary-hanko)'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' }
    )

    // Tactile ink-press impression animation for the Cinnabar Hanko Seal
    const hanko = labelRef.current.querySelector('.sanctuary-hanko')
    if (hanko) {
      gsap.fromTo(
        hanko,
        { opacity: 0, scale: 1.35, rotate: -4 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.65, ease: 'back.out(2.0)', delay: 0.1 }
      )
    }
  }, [activeIndex, selectedProject, introVisible])

  if (!project) return null

  const isHidden = (selectedProject !== null && selectedProject !== undefined) || introVisible

  return (
    <div
      className={`project-ui ${isHidden ? 'hidden' : ''}`}
      ref={labelRef}
      style={{
        opacity: isHidden ? 0 : 1,
        pointerEvents: 'none',
        visibility: isHidden ? 'hidden' : 'visible',
        transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.7s',
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* ── Top-Left: Specimen index & count ── */}
      <div className="project-number-display">
        <div className="project-num-row">
          <span className="animate-label project-num">{project.number}</span>
          <span className="animate-label project-slash"> / 05</span>
        </div>
      </div>

      {/* ── Left-Margin: Traditional Vertical Tategaki Ribbon & Hanko Seal ── */}
      <aside className="sanctuary-ribbon-col" aria-label="Sanctuary Provenance Seal">
        {/* Authentic Red Cinnabar Seal Stamp with Interactive Click */}
        <div
          className="animate-label sanctuary-hanko"
          onClick={() => {
            soundscape.playTactileClick('select')
            onProjectClick?.(activeIndex)
          }}
          onMouseEnter={() => soundscape.playTick()}
          title={`Examine Provenance & Relic: ${project.client} · 印`}
          role="button"
          tabIndex={0}
          aria-label={`Official sanctuary seal: ${project.sealKanji} — Click to inspect`}
        >
          <div className="hanko-seal-box">
            <span className="hanko-kanji">{project.sealKanji}</span>
            <div className="hanko-inner-border" />
          </div>
          <div className="hanko-cord" />
        </div>

        {/* Slender Vertical Calligraphy Line */}
        <div className="animate-label sanctuary-tategaki">
          <span className="tategaki-inscription">{project.sealInscription}</span>
          <span className="tategaki-separator">◆</span>
          <span className="tategaki-era">{project.sealEra}</span>
        </div>

        {/* Hairline guide rule */}
        <div className="tategaki-guide-line" aria-hidden="true" />
      </aside>

      {/* ── Bottom-Left: Title block & provenance metadata ── */}
      <div className="project-title-block">
        <p className="animate-label project-category">
          {project.category} · {project.year}
          {project.japaneseTitle && <span className="project-kanji-tag"> · {project.japaneseTitle}</span>}
        </p>
      </div>

      {/* ── Top-Right: Location & Sanctuary provenance ── */}
      <div className="project-client-display">
        <span className="animate-label project-client-name">{project.client}</span>
        <span className="animate-label project-location">{project.location}</span>
      </div>

      {/* ── Bottom-Left: Tactile 3D Specimen Inspection Button ── */}
      {/* ── Bottom-Left: Authentic Japanese Dry Brush Stroke Button ── */}
      <div className="animate-label specimen-inspect-action">
        <button
          className="specimen-3d-btn specimen-brush-btn"
          onClick={() => {
            soundscape.playTactileClick('select')
            onProjectClick?.(activeIndex)
          }}
          onMouseEnter={() => soundscape.playTick()}
          title={`Examine Specimen ${project.number}: ${project.title}`}
          aria-label={`Examine Specimen ${project.number}: ${project.title}`}
        >
          {/* Authentic Frayed Calligraphy Brush Stroke Texture Ribbon */}
          <img
            src="/brush-stroke-button.png"
            alt=""
            className="brush-stroke-bg-img"
            aria-hidden="true"
          />

          {/* Letterpress Sumi Ink Calligraphy Typography */}
          <span className="brush-btn-content">
            <span className="brush-title-latin">EXAMINE SPECIMEN</span>
          </span>
        </button>
      </div>
    </div>
  )
}
