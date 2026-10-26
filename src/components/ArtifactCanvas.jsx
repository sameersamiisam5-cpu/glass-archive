import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { soundscape } from '../utils/audio.js'

const IOR_PRESETS = [
  { min: 1.0, max: 1.15, label: 'Air / Vacuum (1.00)' },
  { min: 1.15, max: 1.39, label: 'Pure Water / Rain (1.33)' },
  { min: 1.39, max: 1.49, label: 'Fused Quartz (1.46)' },
  { min: 1.49, max: 1.58, label: 'Kyoto Crown Glass (1.52)' },
  { min: 1.58, max: 1.85, label: 'Dense Flint Glass (1.65)' },
  { min: 1.85, max: 2.50, label: 'Sacred Diamond (2.42)' },
]

function getIorLabel(val) {
  const found = IOR_PRESETS.find((p) => val >= p.min && val <= p.max)
  return found ? found.label : `Custom (${val.toFixed(2)})`
}

export default function ArtifactCanvas({ project }) {
  const mountRef = useRef(null)
  const [shaderMode, setShaderMode] = useState('glass') // 'glass' | 'blueprint' | 'gold' | 'embers'
  const [ior, setIor] = useState(project.artifact?.ior ?? 1.52)
  const [isAutoSpin, setIsAutoSpin] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(3.8)

  const threeState = useRef({
    scene:        null,
    camera:       null,
    renderer:     null,
    mesh:         null,
    innerCore:    null,
    rings:        null,
    material:     null,
    targetRotX:   0,
    targetRotY:   0,
    curRotX:      0,
    curRotY:      0,
    isDragging:   false,
    prevMouse:    { x: 0, y: 0 },
    velX:         0,
    velY:         0,
    animId:       null,
  })

  useEffect(() => {
    const container = mountRef.current
    if (!container) return
    const s = threeState.current

    const width = container.clientWidth || 380
    const height = container.clientHeight || 380

    // Scene & Perspective Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50)
    camera.position.set(0, 0, zoomLevel)
    s.scene = scene
    s.camera = camera

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.innerHTML = ''
    container.appendChild(renderer.domElement)
    s.renderer = renderer

    // ── Tailored 3D Procedural Geometries for Kyoto Specimen Catalog ──
    let geometry
    const type = project.artifact?.type || 'dodecahedron'
    if (type === 'lantern') {
      // Specimen 02 (KAGE): Hexagonal lantern pagoda
      geometry = new THREE.CylinderGeometry(0.8, 1.1, 1.7, 6, 2)
    } else if (type === 'octahedron' || project.number === '03') {
      // Specimen 03 (AME): Double-pyramid water prism
      geometry = new THREE.OctahedronGeometry(1.25, 1)
    } else if (type === 'torus' || project.number === '05') {
      // Specimen 05 (HIKARI): Prismatic light sculpture torus knot
      geometry = new THREE.TorusKnotGeometry(0.85, 0.28, 64, 16, 2, 3)
    } else if (type === 'prism' || project.number === '04') {
      // Specimen 04 (ISHI): Minimalist Zen stone monolith
      geometry = new THREE.IcosahedronGeometry(1.2, 2)
    } else {
      // Specimen 01 (SAMI KHAN): Dodecahedral master sanctuary crystal
      geometry = new THREE.DodecahedronGeometry(1.25, 0)
    }

    // Physical Glass Material (Default)
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(...project.accentColor),
      roughness: 0.04,
      metalness: 0.05,
      transmission: 0.95,
      ior: ior,
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.94,
      wireframe: false,
    })
    s.material = material

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    s.mesh = mesh

    // ── Glowing Inner Core (Soul of the Kyoto Specimen) ──
    const coreGeo = new THREE.IcosahedronGeometry(0.48, 1)
    const coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(...project.accentColor),
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    })
    const innerCore = new THREE.Mesh(coreGeo, coreMat)
    mesh.add(innerCore)
    s.innerCore = innerCore

    // ── Celestial Kyoto Blueprint Orbit Rings ──
    const ringGroup = new THREE.Group()
    const ringGeo1 = new THREE.TorusGeometry(1.85, 0.007, 8, 64)
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0xd4af37, // Kyoto Pale Gold
      transparent: true,
      opacity: 0.45,
    })
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1)
    ringGroup.add(ring1)

    const ringGeo2 = new THREE.TorusGeometry(1.68, 0.005, 8, 64)
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x5da8ff, // Cyan laser
      transparent: true,
      opacity: 0.35,
    })
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2)
    ring2.rotation.x = Math.PI / 2.8
    ringGroup.add(ring2)

    scene.add(ringGroup)
    s.rings = ringGroup

    // ── Studio Lighting (Nocturnal Kyoto Illumination) ──
    const keyLight = new THREE.PointLight(0xffffff, 45, 25)
    keyLight.position.set(3.5, 4.0, 5.0)
    scene.add(keyLight)

    const fillLight = new THREE.PointLight(new THREE.Color(...project.accentColor).getHex(), 28, 20)
    fillLight.position.set(-3.5, -3.0, 3.0)
    scene.add(fillLight)

    const amberCandle = new THREE.PointLight(0xff7722, 18, 10)
    amberCandle.position.set(0, 0, 0)
    mesh.add(amberCandle)

    // ── Mouse Drag & Momentum Interaction ──
    const onMouseDown = (e) => {
      s.isDragging = true
      s.prevMouse = { x: e.clientX, y: e.clientY }
      s.velX = 0
      s.velY = 0
    }

    const onMouseMove = (e) => {
      if (!s.isDragging) return
      const dx = e.clientX - s.prevMouse.x
      const dy = e.clientY - s.prevMouse.y

      s.velX = dx * 0.012
      s.velY = dy * 0.012
      s.targetRotY += s.velX
      s.targetRotX += s.velY

      s.prevMouse = { x: e.clientX, y: e.clientY }
    }

    const onMouseUp = () => {
      s.isDragging = false
    }

    // Mouse wheel zoom
    const onWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY * 0.003
      setZoomLevel((prev) => {
        const next = Math.max(2.4, Math.min(6.2, prev + delta))
        if (s.camera) s.camera.position.z = next
        return next
      })
    }

    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('wheel', onWheel, { passive: false })

    // Resize
    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Main Render & Animation Loop ──
    const clock = new THREE.Clock()
    const tick = () => {
      s.animId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()

      // Idle auto-tumble
      if (!s.isDragging && isAutoSpin) {
        s.targetRotY += 0.007
        s.targetRotX = Math.sin(t * 0.6) * 0.18
      } else if (!s.isDragging) {
        // Momentum damping
        s.velX *= 0.94
        s.velY *= 0.94
        s.targetRotY += s.velX
        s.targetRotX += s.velY
      }

      // Smooth lerp rotation
      s.curRotX += (s.targetRotX - s.curRotX) * 0.12
      s.curRotY += (s.targetRotY - s.curRotY) * 0.12

      if (mesh) {
        mesh.rotation.x = s.curRotX
        mesh.rotation.y = s.curRotY
      }

      if (innerCore) {
        innerCore.rotation.x -= 0.014
        innerCore.rotation.y -= 0.018
      }

      if (ringGroup) {
        ringGroup.rotation.z = t * 0.08
        ringGroup.rotation.y = Math.sin(t * 0.3) * 0.2
      }

      // Internal candle flicker
      amberCandle.intensity = 18 + Math.sin(t * 8) * 4

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(s.animId)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      coreGeo.dispose()
      coreMat.dispose()
      ringGeo1.dispose()
      ringMat1.dispose()
      ringGeo2.dispose()
      ringMat2.dispose()
      renderer.dispose()
    }
  }, [project, isAutoSpin])

  // ── Dynamically Update Shader Modes & Material Properties ──
  useEffect(() => {
    const s = threeState.current
    if (!s.material) return

    if (shaderMode === 'glass') {
      s.material.wireframe = false
      s.material.roughness = 0.04
      s.material.metalness = 0.05
      s.material.transmission = 0.95
      s.material.ior = ior
      s.material.color.setRGB(...project.accentColor)
      s.material.emissive.setHex(0x000000)
    } else if (shaderMode === 'blueprint') {
      s.material.wireframe = true
      s.material.transmission = 0.0
      s.material.roughness = 0.8
      s.material.metalness = 0.1
      s.material.color.setHex(0x5da8ff)
      s.material.emissive.setHex(0x0f2d4d)
    } else if (shaderMode === 'gold') {
      s.material.wireframe = false
      s.material.transmission = 0.0
      s.material.roughness = 0.22
      s.material.metalness = 0.92
      s.material.color.setHex(0xe8bd52)
      s.material.emissive.setHex(0x3a2805)
    } else if (shaderMode === 'embers') {
      s.material.wireframe = false
      s.material.transmission = 0.1
      s.material.roughness = 0.35
      s.material.metalness = 0.1
      s.material.color.setHex(0xff3a14)
      s.material.emissive.setHex(0xc22005)
      s.material.emissiveIntensity = 1.8
    }

    s.material.needsUpdate = true
  }, [shaderMode, ior, project])

  const handleRecenter = () => {
    soundscape.playTactileClick('view')
    const s = threeState.current
    s.targetRotX = 0
    s.targetRotY = 0
    s.velX = 0
    s.velY = 0
    if (s.camera) {
      s.camera.position.z = 3.8
      setZoomLevel(3.8)
    }
  }

  const handleModeChange = (mode) => {
    soundscape.playTactileClick('select')
    setShaderMode(mode)
  }

  const handleToggleSpin = () => {
    soundscape.playTick()
    setIsAutoSpin((prev) => !prev)
  }

  return (
    <div className="artifact-inspector" aria-label="Interactive 3D Specimen Laboratory">
      {/* 3D WebGL Canvas Viewport */}
      <div
        className="artifact-canvas-wrapper"
        ref={mountRef}
        title="Click & Drag to rotate 3D specimen · Scroll to zoom"
      >
        <div className="artifact-canvas-badge">
          <span className="live-dot" />
          <span>3D REFRAC LAB</span>
        </div>
      </div>

      {/* ── Interactive Diagnostic Laboratory HUD ── */}
      <div className="artifact-lab-controls">
        {/* Shader Mode Selector */}
        <div className="artifact-mode-strip" role="group" aria-label="Shader Inspection Modes">
          {[
            { id: 'glass', label: '💎 Glass' },
            { id: 'blueprint', label: '📐 Blueprint' },
            { id: 'gold', label: '✦ 24K Gold' },
            { id: 'embers', label: '🔥 Embers' },
          ].map((mode) => (
            <button
              key={mode.id}
              className={`artifact-mode-pill ${shaderMode === mode.id ? 'active' : ''}`}
              onClick={() => handleModeChange(mode.id)}
              onMouseEnter={() => soundscape.playTick()}
              aria-pressed={shaderMode === mode.id}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Refraction IOR Slider */}
        <div className="artifact-ior-section">
          <div className="artifact-ior-header">
            <span className="ior-label-title">INDEX OF REFRACTION (IOR)</span>
            <span className="ior-readout">{getIorLabel(ior)}</span>
          </div>
          <div className="artifact-slider-row">
            <span className="slider-bound">1.00</span>
            <input
              type="range"
              min="1.00"
              max="2.42"
              step="0.02"
              value={ior}
              disabled={shaderMode !== 'glass'}
              onChange={(e) => setIor(parseFloat(e.target.value))}
              className="artifact-range-slider"
              aria-label="Adjust Index of Refraction"
            />
            <span className="slider-bound">2.42</span>
          </div>
        </div>

        {/* Quick Orientation & Spin Actions */}
        <div className="artifact-action-bar">
          <button
            className={`artifact-action-btn ${isAutoSpin ? 'active' : ''}`}
            onClick={handleToggleSpin}
            title={isAutoSpin ? 'Pause auto-rotation' : 'Resume auto-rotation'}
          >
            {isAutoSpin ? '⟳ Auto-Spin: ON' : '⏸ Auto-Spin: OFF'}
          </button>
          <button
            className="artifact-action-btn"
            onClick={handleRecenter}
            title="Reset specimen orientation & zoom"
          >
            ⟲ Recenter
          </button>
        </div>
      </div>
    </div>
  )
}
