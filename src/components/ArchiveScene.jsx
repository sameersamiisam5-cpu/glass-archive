import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { projects } from '../data/projects.js'
import { lerp } from '../utils/animation.js'
import { soundscape } from '../utils/audio.js'

const EMBER_COUNT_DESKTOP = 180
const EMBER_COUNT_MOBILE  = 90
const MAX_DPR             = 1.5

/**
 * Procedurally generates a glowing circular ember sprite with
 * hot white-golden core, vivid amber body, and soft crimson cinnabar rim.
 */
function createEmberTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)')     // Hot core
  gradient.addColorStop(0.2, 'rgba(255, 215, 120, 0.95)')    // Golden flame
  gradient.addColorStop(0.48, 'rgba(255, 115, 35, 0.70)')   // Kyoto amber
  gradient.addColorStop(0.78, 'rgba(230, 42, 22, 0.28)')    // Crimson cinnabar rim
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)')           // Soft falloff

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function ArchiveScene({
  canvasRef,
  onProjectHover,
  onProjectClick,
  onActiveChange,
  scrollStateRef,
  selectedProject,
  introVisible = false,
  isPaused = false,
  setSceneReady,
  viewMode = 'corridor',
}) {
  const shouldPause = isPaused || selectedProject !== null || introVisible
  const isPausedRef = useRef(shouldPause)
  isPausedRef.current = shouldPause
  const stateRef = useRef({
    renderer:        null,
    scene:           null,
    camera:          null,
    particles:       null,
    particleGeo:     null,
    particleMat:     null,
    emberTexture:    null,
    count:           0,
    // Physics arrays for Kyoto ember simulation
    vx:              null,
    vy:              null,
    vz:              null,
    seeds:           null,
    driftSpeed:      null,
    swaySpeed:       null,
    lights:          {},
    clock:           new THREE.Clock(),
    pointerNDC:      new THREE.Vector2(),
    prevPointerNDC:  new THREE.Vector2(),
    pointerVelocity: 0,
    mouseRayEnd:     new THREE.Vector3(),
    rayDir:          new THREE.Vector3(),
    hoveredIdx:      -1,
    activeIdx:       0,
    camX:            0,
    camY:            0,
    camZ:            7.2,
    selectedRef:     null,
    raf:             null,
  })

  const cbRef = useRef({ onProjectHover, onProjectClick, onActiveChange })
  useEffect(() => {
    cbRef.current = { onProjectHover, onProjectClick, onActiveChange }
  })

  // Keep selectedProject in sync with ref for RAF loop
  useEffect(() => {
    stateRef.current.selectedRef = selectedProject
    const s = stateRef.current
    if (!s.lights.moonKey) return

    if (selectedProject !== null && selectedProject !== undefined) {
      gsap.to(s.lights.moonKey, { intensity: 1.6, duration: 0.7 })
      gsap.to(s.lights.templeLantern, { intensity: 1.2, duration: 0.7 })
    } else {
      gsap.to(s.lights.moonKey, { intensity: 1.35, duration: 0.75 })
      gsap.to(s.lights.templeLantern, { intensity: 2.2, duration: 0.75 })
    }
  }, [selectedProject])

  // ─── Init Atmospheric 3D Canvas (Ember Physics & Lighting) ────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current

    // ── Transparent WebGL Renderer ──
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    s.renderer = renderer

    // ── Atmospheric Scene ──
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x04060c, 0.008)
    s.scene = scene

    // ── Perspective Camera (48° FOV) ──
    const camera = new THREE.PerspectiveCamera(
      48, window.innerWidth / window.innerHeight, 0.1, 120
    )
    camera.position.set(0, 0, 7.2)
    s.camera = camera

    // ── Sanctuary Nocturnal Lighting ──
    const ambient = new THREE.AmbientLight(0x06090e, 0.85)
    scene.add(ambient)

    const moonKey = new THREE.DirectionalLight(0xb2d9e5, 1.35)
    moonKey.position.set(3.2, 14.0, 5.0)
    scene.add(moonKey)

    const templeLantern = new THREE.PointLight(0xff8420, 2.2, 16, 2.0)
    templeLantern.position.set(-2.5, -1.0, 3.5)
    scene.add(templeLantern)

    const moonRim = new THREE.DirectionalLight(0xff6a42, 0.55)
    moonRim.position.set(8.0, 5.0, -8.0)
    scene.add(moonRim)

    s.lights = { ambient, moonKey, templeLantern, moonRim }

    // ── Sacred Kyoto Embers Particle System with Real-Time Physics ──
    const count = window.innerWidth < 768 ? EMBER_COUNT_MOBILE : EMBER_COUNT_DESKTOP
    s.count = count

    const particleGeo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    // Physics state
    const vx = new Float32Array(count)
    const vy = new Float32Array(count)
    const vz = new Float32Array(count)
    const seeds = new Float32Array(count)
    const driftSpeed = new Float32Array(count)
    const swaySpeed = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Spatial distribution across 3D sanctuary depth
      pos[i * 3]     = (Math.random() - 0.5) * 26.0
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18.0
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16.0 - 1.0

      // Individual organic movement profiles
      seeds[i]      = Math.random() * Math.PI * 2
      driftSpeed[i] = 0.0035 + Math.random() * 0.0065  // Upward thermal rise
      swaySpeed[i]  = 0.4 + Math.random() * 0.9       // Lateral air breeze

      // Authentic Kyoto fire & spiritual color temperatures
      const tempRoll = Math.random()
      if (tempRoll < 0.65) {
        // Sacred Amber / Golden Honey (65%)
        col[i * 3]     = 1.0
        col[i * 3 + 1] = 0.68 + Math.random() * 0.22
        col[i * 3 + 2] = 0.24 + Math.random() * 0.18
      } else if (tempRoll < 0.88) {
        // Fiery Cinnabar / Crimson Flame (23%)
        col[i * 3]     = 1.0
        col[i * 3 + 1] = 0.28 + Math.random() * 0.16
        col[i * 3 + 2] = 0.12 + Math.random() * 0.08
      } else if (tempRoll < 0.96) {
        // White-Hot High Temperature Core Sparks (8%)
        col[i * 3]     = 1.0
        col[i * 3 + 1] = 0.94 + Math.random() * 0.06
        col[i * 3 + 2] = 0.82 + Math.random() * 0.14
      } else {
        // Mystic Spirit Moon Cyan (4%)
        col[i * 3]     = 0.60 + Math.random() * 0.15
        col[i * 3 + 1] = 0.88 + Math.random() * 0.12
        col[i * 3 + 2] = 1.0
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    particleGeo.setAttribute('color', new THREE.BufferAttribute(col, 3))

    const emberTexture = createEmberTexture()
    s.emberTexture = emberTexture

    const particleMat = new THREE.PointsMaterial({
      size: 0.14,
      map: emberTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    const pts = new THREE.Points(particleGeo, particleMat)
    scene.add(pts)

    s.particles = pts
    s.particleGeo = particleGeo
    s.particleMat = particleMat
    s.vx = vx
    s.vy = vy
    s.vz = vz
    s.seeds = seeds
    s.driftSpeed = driftSpeed
    s.swaySpeed = swaySpeed

    // ── Resize Handler ──
    const onResize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    // ── Pointer Move with Real-time Kinetic Velocity Tracking ──
    const onPointerMove = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX
      const cy = e.touches ? e.touches[0].clientY : e.clientY
      const nx = (cx / window.innerWidth) * 2 - 1
      const ny = -(cy / window.innerHeight) * 2 + 1

      // Track kinetic mouse velocity for turbulent air wake
      const dx = nx - s.pointerNDC.x
      const dy = ny - s.pointerNDC.y
      const instantVel = Math.hypot(dx, dy) * 45
      s.pointerVelocity = Math.min(s.pointerVelocity + instantVel, 4.0)

      s.prevPointerNDC.copy(s.pointerNDC)
      s.pointerNDC.set(nx, ny)
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })

    const onVisibility = () => {
      if (document.hidden) {
        if (s.raf) {
          cancelAnimationFrame(s.raf)
          s.raf = null
        }
      } else if (!isPausedRef.current && !s.raf) {
        s.raf = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    setSceneReady?.(true)
    if (!isPausedRef.current) {
      s.raf = requestAnimationFrame(tick)
    }

    return () => {
      if (s.raf) cancelAnimationFrame(s.raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('touchmove', onPointerMove)
      renderer.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      emberTexture.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pause & Occlusion Controller (Drops CPU/GPU usage to near-zero) ────────
  useEffect(() => {
    const s = stateRef.current
    if (shouldPause) {
      if (s.raf) {
        cancelAnimationFrame(s.raf)
        s.raf = null
      }
    } else {
      if (!s.raf && s.renderer) {
        s.raf = requestAnimationFrame(tick)
      }
    }
  }, [shouldPause])

  // ─── Main RAF Loop ────────────────────────────────────────────────────────
  function tick() {
    const s = stateRef.current
    if (isPausedRef.current || document.hidden) {
      s.raf = null
      return
    }
    s.raf = requestAnimationFrame(tick)

    const { renderer, scene, camera, particleGeo, count } = s
    if (!renderer || !scene || !camera || !particleGeo) return

    const t = s.clock.getElapsedTime()
    const { progress, velocity } = scrollStateRef.current

    // Modulate Web Audio ambient soundscape with scroll velocity
    soundscape.modulate(velocity)

    // Smoothly decay cursor kinetic velocity
    s.pointerVelocity = lerp(s.pointerVelocity, 0, 0.055)

    // ── Camera: Interactive Multi-Axis 3D Parallax (Position + Pitch/Yaw/Roll) ──
    const targetCamX = s.pointerNDC.x * 0.72
    const targetCamY = s.pointerNDC.y * 0.42
    s.camX = lerp(s.camX ?? 0, targetCamX, 0.055)
    s.camY = lerp(s.camY ?? 0, targetCamY, 0.055)
    camera.position.set(s.camX, s.camY, 7.2)

    // Multi-axis rotational depth: Pitch (X), Yaw (Y), subtle Roll bank (Z)
    const targetRotX = -s.pointerNDC.y * 0.045
    const targetRotY = s.pointerNDC.x * 0.068
    const targetRotZ = -s.pointerNDC.x * 0.014
    camera.rotation.x = lerp(camera.rotation.x, targetRotX, 0.055)
    camera.rotation.y = lerp(camera.rotation.y, targetRotY, 0.055)
    camera.rotation.z = lerp(camera.rotation.z, targetRotZ, 0.055)

    // ── Project Ray from Camera through Cursor into 3D Space ──
    s.mouseRayEnd.set(s.pointerNDC.x, s.pointerNDC.y, 0.5).unproject(camera)
    s.rayDir.copy(s.mouseRayEnd).sub(camera.position).normalize()
    const rayOrigin = camera.position
    const rayDir = s.rayDir

    // ── Sacred Kyoto Ember Real-Time Particle Physics ──
    const pos = particleGeo.attributes.position.array
    const repelRadius = 2.6
    const repelRadiusSq = repelRadius * repelRadius

    const hasKineticWake = s.pointerVelocity > 0.04

    for (let i = 0; i < count; i++) {
      const idx = i * 3
      const px = pos[idx]
      const py = pos[idx + 1]
      const pz = pos[idx + 2]

      // Apply repulsion physics only when cursor has kinetic velocity wake
      if (hasKineticWake) {
        const wx = px - rayOrigin.x
        const wy = py - rayOrigin.y
        const wz = pz - rayOrigin.z
        const tProj = wx * rayDir.x + wy * rayDir.y + wz * rayDir.z

        if (tProj > 0 && tProj < 24.0) {
          const cx = rayOrigin.x + rayDir.x * tProj
          const cy = rayOrigin.y + rayDir.y * tProj
          const cz = rayOrigin.z + rayDir.z * tProj

          const dx = px - cx
          const dy = py - cy
          const dz = pz - cz
          const distSq = dx * dx + dy * dy + dz * dz

          if (distSq < repelRadiusSq && distSq > 0.0001) {
            const dist = Math.sqrt(distSq)
            const factor = (1.0 - dist / repelRadius)
            const force = factor * (0.042 + s.pointerVelocity * 0.075)

            s.vx[i] += (dx / dist) * force
            s.vy[i] += (dy / dist) * force
            s.vz[i] += (dz / dist) * force * 1.3

            s.vx[i] += -(dy / dist) * force * 0.35
            s.vy[i] += (dx / dist) * force * 0.35
          }
        }
      }

      // Air resistance / viscous damping
      s.vx[i] *= 0.925
      s.vy[i] *= 0.925
      s.vz[i] *= 0.925

      // Organic thermal updraft & lateral wind sway
      const seed = s.seeds[i]
      const sway = Math.sin(t * s.swaySpeed[i] + seed) * 0.0022
      const updraft = s.driftSpeed[i] + Math.sin(t * 1.6 + seed * 2) * 0.0012

      // Apply net physics
      pos[idx]     += s.vx[i] + sway
      pos[idx + 1] += s.vy[i] + updraft
      pos[idx + 2] += s.vz[i]

      // Boundary recycling (continuous smooth ember stream)
      if (pos[idx + 1] > 9.5) {
        pos[idx + 1] = -9.5
        pos[idx]     = (Math.random() - 0.5) * 26.0
        pos[idx + 2] = (Math.random() - 0.5) * 16.0 - 1.0
        s.vx[i] = 0
        s.vy[i] = 0
        s.vz[i] = 0
      } else if (pos[idx + 1] < -9.5) {
        pos[idx + 1] = 9.5
      }

      if (pos[idx] > 14.5)  pos[idx] = -14.5
      if (pos[idx] < -14.5) pos[idx] = 14.5
    }

    particleGeo.attributes.position.needsUpdate = true

    // Subtle drift with scroll velocity
    if (s.particles) {
      s.particles.position.z = -velocity * 1.8
    }

    // ── Continuous scroll index (0.0 to 4.0) ──
    const scrollIdx  = progress * (projects.length - 1)
    const closestIdx = Math.min(projects.length - 1, Math.max(0, Math.round(scrollIdx)))
    if (closestIdx !== s.activeIdx) {
      s.activeIdx = closestIdx
      cbRef.current.onActiveChange?.(closestIdx)
    }

    // ── Harmonized Lighting with Kinetic Air Turbulence & Pointer Tracking ──
    if (s.lights.moonKey) {
      s.lights.moonKey.intensity = 1.35 + Math.sin(t * 0.8) * 0.08
    }

    if (s.lights.templeLantern) {
      const lanternBase = s.selectedRef ? 1.2 : 2.2
      const organicFlicker = Math.sin(t * 3.5) * 0.12 + Math.sin(t * 7.8) * 0.06
      const kineticFlicker = Math.sin(t * 22.0) * 0.25 * (s.pointerVelocity * 0.5)
      s.lights.templeLantern.intensity = lanternBase + organicFlicker + kineticFlicker

      // Lantern light follows cursor subtly to illuminate glowing embers
      s.lights.templeLantern.position.x = -2.5 + s.pointerNDC.x * 0.8
      s.lights.templeLantern.position.y = -1.0 + s.pointerNDC.y * 0.5
    }

    renderer.render(scene, camera)
  }

  return null
}
