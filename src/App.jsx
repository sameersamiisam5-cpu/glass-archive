import { useRef, useState, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Scene } from './components/Scene.jsx'
import ArchiveScene from './components/ArchiveScene.jsx'
import ProjectUI from './components/ProjectUI.jsx'
import ProjectDetails from './components/ProjectDetails.jsx'
import Intro from './components/Intro.jsx'
import HUD from './components/HUD.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import ArchiveIndexTray from './components/ArchiveIndexTray.jsx'
import { useSteppedDolly } from './hooks/useSteppedDolly.js'
import { soundscape } from './utils/audio.js'
import { projects } from './data/projects.js'
import EditorialWatermark from './components/EditorialWatermark.jsx'
import CustomReload from './components/CustomReload.jsx'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const canvasRef = useRef(null)
  const scrollStateRef = useRef({ progress: 0, velocity: 0 })
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const [selectedProject, setSelectedProject] = useState(null)
  const [introVisible, setIntroVisible] = useState(true)
  const [sceneReady, setSceneReady] = useState(false)
  const [viewMode, setViewMode] = useState('corridor') // 'corridor' | 'orbit' | 'matrix'
  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const [cursorMode, setCursorMode] = useState(null)
  const [isReloading, setIsReloading] = useState(false)

  // ── Reset Scroll & Dismiss Hard-Refresh Preloader On Mount ───────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
      window.scrollTo(0, 0)
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.dismissSanctuaryPreloader) {
        window.dismissSanctuaryPreloader()
      }
    }, 450)
    return () => clearTimeout(timer)
  }, [])

  // ── Stepped Cinematic Dolly Scroll Engine (60+ FPS Zero-Rerender Tracking) ──
  const dollyRef = useSteppedDolly(({ progress, velocity, targetIndex }) => {
    scrollStateRef.current.progress = progress
    scrollStateRef.current.velocity = velocity

    const computedIdx = typeof targetIndex === 'number'
      ? targetIndex
      : Math.min(projects.length - 1, Math.max(0, Math.round(progress * (projects.length - 1))))
    setActiveIndex((prev) => (prev === computedIdx ? prev : computedIdx))
  }, {
    totalSteps: projects.length,
    introVisible,
    selectedProject,
    onLeaveIntro: () => setIntroVisible(false),
    onEnterIntro: () => setIntroVisible(true),
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProjectHover = useCallback((idx) => {
    setHoveredIndex(idx)
  }, [])

  const handleProjectClick = useCallback((idx) => {
    if (selectedProject !== null) return
    setSelectedProject(idx)
    soundscape.playTactileClick('select')
  }, [selectedProject])

  const handleBack = useCallback(() => {
    setSelectedProject(null)
    soundscape.playTactileClick('view')
  }, [])

  const handleActiveChange = useCallback((idx) => {
    setActiveIndex(idx)
  }, [])

  const handleJumpToProject = useCallback((idx) => {
    const targetProgress = idx / (projects.length - 1)
    scrollStateRef.current.progress = targetProgress
    setActiveIndex(idx)

    if (dollyRef.current) {
      dollyRef.current.stepTo(idx)
    }
    if (introVisible) setIntroVisible(false)
  }, [dollyRef, introVisible])

  const handleScrub = useCallback((targetProgress) => {
    scrollStateRef.current.progress = targetProgress
    const computedIdx = Math.min(
      projects.length - 1,
      Math.max(0, Math.round(targetProgress * (projects.length - 1)))
    )
    setActiveIndex((prev) => (prev === computedIdx ? prev : computedIdx))

    if (dollyRef.current) {
      dollyRef.current.scrubTo(targetProgress, true)
    }
    if (introVisible) setIntroVisible(false)
  }, [dollyRef, introVisible])

  const handleNavigateProject = useCallback((idx) => {
    setSelectedProject(idx)
    setActiveIndex(idx)
  }, [])

  const handleEnterIntro = useCallback(() => {
    setIntroVisible(false)
    if (dollyRef.current) {
      dollyRef.current.dismissIntro()
      dollyRef.current.stepTo(0, true)
    }
    try {
      soundscape.init()
      soundscape.playSanctuaryChime()
    } catch {}
  }, [dollyRef])

  const handleTriggerReload = useCallback(() => {
    setIsReloading(true)
    soundscape.playTactileClick('select')
  }, [])

  const handleReloadComplete = useCallback(() => {
    // Reset all internal spatial states
    if (dollyRef.current) {
      dollyRef.current.stepTo(0, true)
    }
    scrollStateRef.current.progress = 0
    scrollStateRef.current.velocity = 0
    setScrollProgress(0)
    setActiveIndex(0)
    setSelectedProject(null)
    setIsIndexOpen(false)
    setViewMode('corridor')
    setIntroVisible(true)
    setIsReloading(false)
  }, [dollyRef])

  const handleHardReload = useCallback(() => {
    window.location.reload()
  }, [])

  // ── Comprehensive Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Toggle Audio: 'M' or 'm'
      if (e.key === 'm' || e.key === 'M') {
        soundscape.toggleMute()
      }

      // Close modal / index: 'Escape'
      if (e.key === 'Escape') {
        if (selectedProject !== null) {
          handleBack()
        } else if (isIndexOpen) {
          setIsIndexOpen(false)
        }
      }

      // Open / Close Index: 'I' or 'i'
      if ((e.key === 'i' || e.key === 'I') && selectedProject === null) {
        setIsIndexOpen((prev) => !prev)
        soundscape.playTactileClick('view')
      }

      // View mode shortcuts: 1, 2, 3
      if (selectedProject === null) {
        if (e.key === '1') setViewMode('corridor')
        if (e.key === '2') setViewMode('orbit')
        if (e.key === '3') setViewMode('matrix')
      }

      // Navigate projects: ArrowLeft / ArrowRight
      if (e.key === 'ArrowRight') {
        if (selectedProject !== null) {
          const next = (selectedProject + 1) % projects.length
          handleNavigateProject(next)
        } else {
          const next = Math.min(projects.length - 1, activeIndex + 1)
          handleJumpToProject(next)
        }
      } else if (e.key === 'ArrowLeft') {
        if (selectedProject !== null) {
          const prev = (selectedProject - 1 + projects.length) % projects.length
          handleNavigateProject(prev)
        } else {
          const prev = Math.max(0, activeIndex - 1)
          handleJumpToProject(prev)
        }
      }

      // Reload Sanctuary: 'R' or 'r'
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !isReloading) {
        handleTriggerReload()
      }

      // Space: Focus / Inspect active project
      if (e.key === ' ' && selectedProject === null) {
        e.preventDefault()
        handleProjectClick(activeIndex)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    selectedProject,
    activeIndex,
    isIndexOpen,
    isReloading,
    handleBack,
    handleNavigateProject,
    handleJumpToProject,
    handleProjectClick,
    handleTriggerReload,
  ])

  const isScenePaused = selectedProject !== null || introVisible

  return (
    <main className="app-root">
      {/* ThreeUI Temple Night Scene in hero section behind cards (Paused when occluded) */}
      <Scene isPaused={isScenePaused} />

      {/* Massive Middle-Ground Editorial Parallax Watermark (Kanji & Numerals) */}
      <EditorialWatermark
        activeIndex={activeIndex}
        scrollStateRef={scrollStateRef}
        selectedProject={selectedProject}
        onProjectClick={handleProjectClick}
        introVisible={introVisible}
        viewMode={viewMode}
        onJumpToProject={handleJumpToProject}
      />

      {/* Awwwards Custom Magnetic Cursor */}
      <CustomCursor
        hoveredIndex={hoveredIndex}
        selectedProject={selectedProject}
        cursorMode={cursorMode}
      />

      {/* Three.js canvas — fixed fullscreen */}
      <canvas
        ref={canvasRef}
        className="scene-canvas"
        aria-label="3D Kyoto architectural sanctuary scene"
        role="img"
      />

      {/* Scene logic with multi-view modes and optical glass shaders (Paused when occluded) */}
      <ArchiveScene
        canvasRef={canvasRef}
        onProjectHover={handleProjectHover}
        onProjectClick={handleProjectClick}
        onActiveChange={handleActiveChange}
        scrollStateRef={scrollStateRef}
        selectedProject={selectedProject}
        introVisible={introVisible}
        isPaused={isScenePaused}
        setSceneReady={setSceneReady}
        viewMode={viewMode}
      />

      {/* Scroll spacer — drives Lenis scroll trajectory */}
      <div className="scroll-driver" aria-hidden="true" />

      {/* Cinematic Intro Overlay */}
      <Intro
        visible={introVisible}
        onEnter={handleEnterIntro}
      />

      {/* Active Specimen UI Overlay */}
      <ProjectUI
        activeIndex={activeIndex}
        selectedProject={selectedProject}
        hoveredIndex={hoveredIndex}
        introVisible={introVisible}
        onProjectClick={handleProjectClick}
      />

      {/* Cybernetic Telemetry HUD */}
      <HUD
        activeIndex={activeIndex}
        scrollStateRef={scrollStateRef}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onJumpToProject={handleJumpToProject}
        onScrub={handleScrub}
        selectedProject={selectedProject}
        onOpenIndex={() => setIsIndexOpen(true)}
        onReload={handleTriggerReload}
        introVisible={introVisible}
      />

      {/* Cinematic Custom Sanctuary Reload Page */}
      <CustomReload
        isOpen={isReloading}
        onComplete={handleReloadComplete}
        onHardReload={handleHardReload}
      />

      {/* Interactive Case Study Modal with 3D Artifact Inspector */}
      <ProjectDetails
        selectedProject={selectedProject}
        onBack={handleBack}
        onNavigateProject={handleNavigateProject}
      />

      {/* Full Catalog Index Tray */}
      <ArchiveIndexTray
        isOpen={isIndexOpen}
        onClose={() => setIsIndexOpen(false)}
        onSelectProject={(idx) => {
          handleJumpToProject(idx)
          handleProjectClick(idx)
        }}
        activeIndex={activeIndex}
      />

      {/* Cinematic Film Grain & Vignette */}
      <div className="noise-overlay" aria-hidden="true" />
    </main>
  )
}
