import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { projects } from '../data/projects.js'
import { soundscape } from '../utils/audio.js'

export default function ProjectDetails({
  selectedProject,
  onBack,
  onNavigateProject,
}) {
  const containerRef = useRef(null)
  const prevSelected = useRef(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'craft' | 'specs' | 'blueprint'
  const [showLiveDemo, setShowLiveDemo] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    if (selectedProject !== null && selectedProject !== undefined) {
      soundscape.playTactileClick('select')
      gsap.set(el, { pointerEvents: 'auto', visibility: 'visible' })
      gsap.fromTo(
        el.querySelectorAll('.detail-animate'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.05,
          ease: 'power3.out',
          delay: 0.25,
        }
      )
      gsap.to(el, { opacity: 1, duration: 0.35, delay: 0.15 })
    } else {
      // Immediately disable pointer events so the closing overlay never blocks page clicks!
      gsap.set(el, { pointerEvents: 'none' })
      gsap.to(el.querySelectorAll('.detail-animate'), {
        opacity: 0,
        y: -18,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.in',
      })
      gsap.to(el, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          gsap.set(el, { pointerEvents: 'none', visibility: 'hidden' })
        },
      })
    }

    prevSelected.current = selectedProject
  }, [selectedProject])

  const isVisible = selectedProject !== null && selectedProject !== undefined
  const project = isVisible
    ? projects[selectedProject]
    : prevSelected.current !== null
    ? projects[prevSelected.current]
    : null

  if (!project) return null

  const prevIdx = (selectedProject - 1 + projects.length) % projects.length
  const nextIdx = (selectedProject + 1) % projects.length

  return (
    <div
      ref={containerRef}
      className={`project-details-overlay ${isVisible ? 'open' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      role="dialog"
      aria-label={`${project.title} — Architectural Specimen Case Study`}
      aria-modal="true"
    >
      <div className="details-backdrop" onClick={onBack} />

      {/* ── Authentic Japanese Letter Map with Swordsman Cutout ── */}
      <div className="letter-map-master-layout detail-animate">
        {/* Authentic Japanese Scroll Map Canvas Frame (Rollers, Cherry Blossoms, Aged Washi) */}
        <div className="letter-map-scroll-stage">
          {/* Subtle Washi Mulberry Fiber Aging Overlay */}
          <div className="scroll-washi-fiber-layer" aria-hidden="true" />

          {/* Standalone Samurai Swordsman Guardian on the Left */}
          <div className="swordsman-cutout-col" aria-hidden="true">
            <div className="guardian-vertical-ribbon">
              <span className="guardian-chop">守</span>
              <span className="guardian-kanji">洛中守護武士</span>
              <span className="guardian-sub">GUARDIAN</span>
            </div>
            <img
              src="/swordsman-cutout.png"
              alt="Samurai Swordsman Guardian"
              className="swordsman-cutout-img"
            />
            <div className="swordsman-ground-shadow" />
          </div>

          {/* Map Monograph Content: Text Embedded Directly on the Map */}
          <div className="details-content-col letter-map-content">
            {/* Top Bar with Antique Lacquer Navigation Buttons */}
            <div className="detail-animate details-top-nav">
              <div className="details-breadcrumbs scroll-cartouche-header">
                <div className="scroll-kanji-chop-badge">
                  <span className="chop-kanji">洛</span>
                  <span className="chop-latin">KYOTO</span>
                </div>
                <div className="cartouche-titles">
                  <span className="cartouche-brand">佐美館 · ARCHIVE</span>
                  <span className="cartouche-sep">◆</span>
                  <span className="cartouche-specimen">巻之{project.number} · SPECIMEN {project.number}</span>
                </div>
              </div>

              <div className="details-nav-actions">
                <button
                  className="scroll-btn scroll-btn-prev details-3d-btn"
                  onClick={() => {
                    onNavigateProject(prevIdx)
                    soundscape.playGlassChime(prevIdx)
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  title="Previous Specimen (Arrow Left)"
                  aria-label="Previous Specimen"
                >
                  <span className="btn-inner btn-front">◀ 前巻 PREV</span>
                </button>
                <button
                  className="scroll-btn scroll-btn-next details-3d-btn"
                  onClick={() => {
                    onNavigateProject(nextIdx)
                    soundscape.playGlassChime(nextIdx)
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  title="Next Specimen (Arrow Right)"
                  aria-label="Next Specimen"
                >
                  <span className="btn-inner btn-front">次巻 NEXT ▶</span>
                </button>
                <button
                  className="scroll-btn scroll-btn-close details-3d-btn details-close-3d"
                  onClick={() => {
                    onBack()
                    soundscape.playTactileClick('view')
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  title="Close Letter Scroll (Escape)"
                  aria-label="Close Letter Scroll"
                >
                  <span className="btn-inner btn-front">閉巻 ✕ CLOSE</span>
                </button>
              </div>
            </div>

            {/* Specimen Header Block */}
            <div className="detail-animate details-header-block">
              <div className="details-header-top-row">
                <div className="details-specimen-seal-badge">
                  <span className="seal-vermilion-chop">印</span>
                  <span className="seal-badge-text">巻首 · SPECIMEN {project.number} · {project.category}</span>
                </div>
                <div className="details-header-right-meta">
                  <span className="details-year-tag">制作年 {project.year} · KYOTO 洛中聖域</span>
                  <div className="artifact-hanko-seal" title={project.sealInscription}>
                    <span className="hanko-mini-kanji">{project.sealKanji}</span>
                  </div>
                </div>
              </div>

              <div className="details-title-row">
                <h1 className="details-title">{project.title}</h1>
                {project.japaneseTitle && (
                  <span className="details-japanese-name">「{project.japaneseTitle}」</span>
                )}
              </div>
              <p className="details-subtitle">{project.subtitle}</p>
            </div>

            {/* Antique Hand-Carved Japanese Seal Tabs */}
            <div className="detail-animate details-tabs-strip" role="tablist">
              {[
                { id: 'overview', en: 'Overview', ja: '概要', chop: '壱' },
                { id: 'craft', en: 'Craft', ja: '技法', chop: '弐' },
                { id: 'specs', en: 'Metrics', ja: '仕様', chop: '参' },
                { id: 'blueprint', en: 'Blueprint', ja: '設計', chop: '四' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`detail-tab-chop ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    soundscape.playTactileClick('view')
                  }}
                  onMouseEnter={() => soundscape.playTick()}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <span className="tab-chop-num">{tab.chop}</span>
                  <span className="tab-chop-ja">{tab.ja}</span>
                  <span className="tab-chop-sep">·</span>
                  <span className="tab-chop-en">{tab.en}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents: Authentic Scholar Manuscript on Aged Mulberry Washi */}
            <div className="detail-animate details-tab-pane">
              {activeTab === 'overview' && (
                <div className="tab-pane-content letter-manuscript-pane">
                  <div className="embedded-map-text-flow">
                    <p className="details-lead-desc">
                      <span className="calligraphy-lead-bracket">【 要旨 】</span>
                      {project.description}
                    </p>
                    <p className="details-secondary-desc">
                      {project.overview}
                    </p>

                    <div className="details-provenance-box imperial-colophon-box">
                      <div className="colophon-header">
                        <span className="colophon-seal-chop">印</span>
                        <span className="provenance-title">SANCTUARY PROVENANCE · 洛中寺院由来証</span>
                      </div>
                      <p className="provenance-client">{project.client} — {project.location}</p>
                      <div className="colophon-footer-annotation">
                        <span>Kyoto Imperial Grid · 35.0116° N, 135.7681° E</span>
                        <span className="colophon-kanji-stamp">佐美館 主宰 謹製</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'craft' && (
                <div className="tab-pane-content letter-manuscript-pane">
                  <div className="challenge-block treatise-block">
                    <h4 className="treatise-heading">
                      <span className="treatise-chop">問</span>
                      <span>本質と挑戦 · The Essence & Challenge</span>
                    </h4>
                    <p className="treatise-body">{project.challenge}</p>
                  </div>
                  <div className="solution-block treatise-block">
                    <h4 className="treatise-heading">
                      <span className="treatise-chop">解</span>
                      <span>技法と物質性 · The Craft & Materiality</span>
                    </h4>
                    <p className="treatise-body">{project.solution}</p>
                  </div>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="tab-pane-content letter-manuscript-pane">
                  <div className="metrics-grid">
                    {project.metrics.map((m) => (
                      <div key={m.label} className="metric-card rice-paper-card">
                        <span className="card-pin-dot pin-tl" aria-hidden="true" />
                        <span className="card-pin-dot pin-tr" aria-hidden="true" />
                        <span className="metric-val brush-number">{m.value}</span>
                        <span className="metric-label letterpress-label">{m.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tech-stack-section">
                    <h4 className="treatise-heading">
                      <span className="treatise-chop">材</span>
                      <span>素材と工法 · Materials & Disciplines</span>
                    </h4>
                    <div className="details-tech-pills">
                      {project.tech.map((t) => (
                        <span key={t} className="tech-pill calligraphic-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'blueprint' && (
                <div className="tab-pane-content letter-manuscript-pane">
                  <div className="blueprint-telemetry-grid">
                    <div className="blueprint-tile cartographic-tile">
                      <span className="tile-survey-cross" aria-hidden="true">✛</span>
                      <span className="tile-label">SANCTUARY COORDINATES · 聖域座標</span>
                      <strong className="tile-value">35.0116° N, 135.7681° E</strong>
                      <small>Kyoto Imperial Sanctuary Grid</small>
                    </div>
                    <div className="blueprint-tile cartographic-tile">
                      <span className="tile-survey-cross" aria-hidden="true">✛</span>
                      <span className="tile-label">INDEX OF REFRACTION · 屈折率</span>
                      <strong className="tile-value">{project.artifact?.ior?.toFixed(2) ?? '1.52'} η</strong>
                      <small>Optical Crown Dispersion</small>
                    </div>
                    <div className="blueprint-tile cartographic-tile">
                      <span className="tile-survey-cross" aria-hidden="true">✛</span>
                      <span className="tile-label">SURFACE ROUGHNESS · 鏡面粗度</span>
                      <strong className="tile-value">{project.artifact?.roughness ?? '0.04'} μm</strong>
                      <small>Mirror Polish Japanese Glass</small>
                    </div>
                    <div className="blueprint-tile cartographic-tile">
                      <span className="tile-survey-cross" aria-hidden="true">✛</span>
                      <span className="tile-label">SPECIMEN CLASSIFICATION · 幾何分類</span>
                      <strong className="tile-value">{project.artifact?.type?.toUpperCase() ?? 'DODECAHEDRON'}</strong>
                      <small>Polyhedral Sacred Geometry</small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="detail-animate details-footer-actions">
              <button
                className="btn-scroll-action btn-glow-primary"
                onClick={() => {
                  setShowLiveDemo(true)
                  soundscape.playTactileClick('select')
                }}
                onMouseEnter={() => soundscape.playTick()}
              >
                【 鑑賞 】 Launch Fullscreen Exhibit →
              </button>
              <div className="keyboard-shortcuts-hint">
                <span>[ ESC ] Return</span>
                <span>[ ← / → ] Cycle Specimen</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Focused Exhibit View Modal ── */}
      {showLiveDemo && (
        <div className="live-demo-modal" role="dialog" aria-modal="true">
          <div className="live-demo-content">
            <div className="live-demo-bar">
              <div className="demo-status">
                <span className="demo-live-dot" />
                <span>Kyoto Sanctuary · Specimen {project.number}: {project.title}</span>
              </div>
              <button
                className="demo-close-btn"
                onClick={() => {
                  setShowLiveDemo(false)
                  soundscape.playTactileClick('view')
                }}
              >
                ✕ Close Exhibit
              </button>
            </div>

            <div className="live-demo-canvas-area">
              <div className="demo-viewport-hud">
                <span>Kyoto Architectural Sanctuary</span>
                <span>{project.location}</span>
                <span>{project.year}</span>
              </div>
              <div className="demo-centerpiece">
                <h2 className="demo-hero-title">{project.title}</h2>
                <p className="demo-hero-sub">{project.subtitle}</p>
                <div className="demo-metrics-strip">
                  {project.metrics.map((m) => (
                    <div key={m.label} className="demo-strip-item">
                      <strong>{m.value}</strong>
                      <small>{m.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
