import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { soundscape } from '../utils/audio.js'

/**
 * Stepped Cinematic Dolly Scroll Engine
 * 
 * Replaces standard Lenis continuous scrolling with a high-end, discrete
 * cinematic camera dolly system:
 * - Each scroll gesture (wheel, trackpad, touch swipe, arrow keys) glides the
 *   camera purposefully from one project specimen to the next (01 -> 02 -> 03 -> 04 -> 05).
 * - Interpolated with silky GSAP power3.out cubic bezier ease (~1.05s duration).
 * - Triggers authentic Kyoto singing bowl glass chimes on each transition.
 * - Gesture thresholding & cooldown prevent chaotic skipping on rapid trackpad flings.
 * - Full backward-compatibility with HUD timeline scrubbing and direct bead jumping.
 */
export function useSteppedDolly(onScroll, {
  totalSteps = 5,
  introVisible = false,
  selectedProject = null,
  onLeaveIntro,
  onEnterIntro,
} = {}) {
  const dollyRef = useRef(null)
  const onScrollRef = useRef(onScroll)
  onScrollRef.current = onScroll

  const onLeaveIntroRef = useRef(onLeaveIntro)
  onLeaveIntroRef.current = onLeaveIntro

  const onEnterIntroRef = useRef(onEnterIntro)
  onEnterIntroRef.current = onEnterIntro

  const stateRef = useRef({
    currentStep: 0,
    targetStep: 0,
    progress: 0,
    isTransitioning: false,
    cooldownUntil: 0,
    accumulatedDelta: 0,
    introVisible,
    selectedProject,
  })

  // Keep live references updated
  useEffect(() => {
    stateRef.current.introVisible = introVisible
    stateRef.current.selectedProject = selectedProject
  }, [introVisible, selectedProject])

  useEffect(() => {
    const s = stateRef.current
    const proxy = { progress: s.progress }
    let tween = null

    const emitProgress = (p, v, step) => {
      s.progress = p
      onScrollRef.current?.({
        progress: p,
        velocity: v,
        targetIndex: step,
      })
    }

    const animateToStep = (targetStep, duration = 1.05, immediate = false) => {
      const clampedStep = Math.max(0, Math.min(totalSteps - 1, targetStep))
      const targetProgress = clampedStep / (totalSteps - 1)
      s.targetStep = clampedStep

      if (tween) tween.kill()

      if (immediate) {
        proxy.progress = targetProgress
        s.currentStep = clampedStep
        s.isTransitioning = false
        emitProgress(targetProgress, 0, clampedStep)
        return
      }

      s.isTransitioning = true
      let lastTime = performance.now()
      let lastP = proxy.progress

      // Harmonic singing bowl chime for the reached specimen
      soundscape.playGlassChime(clampedStep)

      tween = gsap.to(proxy, {
        progress: targetProgress,
        duration: duration,
        ease: 'power3.out',
        onUpdate: () => {
          const now = performance.now()
          const dt = Math.max(0.001, (now - lastTime) / 1000)
          const dp = proxy.progress - lastP
          const velocity = (dp / dt) * 0.055
          lastTime = now
          lastP = proxy.progress

          emitProgress(proxy.progress, velocity, clampedStep)
        },
        onComplete: () => {
          s.progress = targetProgress
          s.currentStep = clampedStep
          s.isTransitioning = false
          emitProgress(targetProgress, 0, clampedStep)
        },
      })
    }

    const scrubToProgress = (targetP, immediate = false) => {
      const clampedP = Math.max(0, Math.min(1, targetP))
      const approxStep = Math.min(totalSteps - 1, Math.max(0, Math.round(clampedP * (totalSteps - 1))))
      s.targetStep = approxStep

      if (tween) tween.kill()

      if (immediate) {
        proxy.progress = clampedP
        s.currentStep = approxStep
        s.isTransitioning = false
        emitProgress(clampedP, 0, approxStep)
      } else {
        s.isTransitioning = true
        let lastTime = performance.now()
        let lastP = proxy.progress

        tween = gsap.to(proxy, {
          progress: clampedP,
          duration: 0.65,
          ease: 'power2.out',
          onUpdate: () => {
            const now = performance.now()
            const dt = Math.max(0.001, (now - lastTime) / 1000)
            const dp = proxy.progress - lastP
            const velocity = (dp / dt) * 0.05
            lastTime = now
            lastP = proxy.progress

            emitProgress(proxy.progress, velocity, approxStep)
          },
          onComplete: () => {
            s.progress = clampedP
            s.currentStep = approxStep
            s.isTransitioning = false
            emitProgress(clampedP, 0, approxStep)
          },
        })
      }
    }

    const stepNext = () => {
      if (s.introVisible) {
        // User scrolled down while intro was active -> Enter the sanctuary!
        s.introVisible = false
        onLeaveIntroRef.current?.()
        animateToStep(0, 0.85)
        return
      }
      if (s.currentStep < totalSteps - 1) {
        animateToStep(s.currentStep + 1, 1.05)
      }
    }

    const stepPrev = () => {
      if (s.introVisible) return // Already at intro

      // Clamp at project 0 (stay on Specimen 01 without ejecting user back to intro)
      if (s.currentStep > 0) {
        animateToStep(s.currentStep - 1, 1.05)
      }
    }

    // ── Mouse Wheel & Trackpad Gesture Interpretation ──────────────────────
    const onWheel = (e) => {
      // Allow internal scrolling in detail dialogs or drawers
      if (e.target.closest('.details-modal, .details-content-col, .index-tray-drawer')) {
        return
      }

      e.preventDefault()

      // If project detail modal is open, suppress background stepping
      if (s.selectedProject !== null && s.selectedProject !== undefined) {
        return
      }

      const now = performance.now()
      if (now < s.cooldownUntil || s.isTransitioning) {
        return
      }

      s.accumulatedDelta += e.deltaY

      // Accumulator threshold ensures intentional gesture recognition
      if (s.accumulatedDelta > 35) {
        s.accumulatedDelta = 0
        s.cooldownUntil = now + 480
        stepNext()
      } else if (s.accumulatedDelta < -35) {
        s.accumulatedDelta = 0
        s.cooldownUntil = now + 480
        stepPrev()
      }
    }

    // ── Touch Swipe Gestures ──────────────────────────────────────────────
    let touchStartY = 0
    let touchStartX = 0

    const onTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
      }
    }

    const onTouchEnd = (e) => {
      if (e.target.closest('.details-modal, .details-content-col, .index-tray-drawer')) {
        return
      }
      if (s.selectedProject !== null && s.selectedProject !== undefined) {
        return
      }

      if (!e.changedTouches || !e.changedTouches[0]) return
      const deltaY = touchStartY - e.changedTouches[0].clientY
      const deltaX = touchStartX - e.changedTouches[0].clientX

      // Ignore predominantly horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) return

      const now = performance.now()
      if (now < s.cooldownUntil || s.isTransitioning) return

      if (deltaY > 38) {
        s.cooldownUntil = now + 480
        stepNext()
      } else if (deltaY < -38) {
        s.cooldownUntil = now + 480
        stepPrev()
      }
    }

    // ── Keyboard Arrow Navigation ─────────────────────────────────────────
    const onKeyDown = (e) => {
      if (s.selectedProject !== null && s.selectedProject !== undefined) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        stepNext()
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault()
        stepPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        animateToStep(0, 1.0)
      } else if (e.key === 'End') {
        e.preventDefault()
        animateToStep(totalSteps - 1, 1.0)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    // Expose control API via dollyRef
    dollyRef.current = {
      stepTo: (stepIdx, immediate = false) => animateToStep(stepIdx, 1.05, immediate),
      scrubTo: (targetP, immediate = false) => scrubToProgress(targetP, immediate),
      stepNext,
      stepPrev,
      dismissIntro: () => {
        s.introVisible = false
        s.currentStep = 0
        s.progress = 0
        proxy.progress = 0
      },
      // Backward-compatible interface for any code calling scrollTo
      scrollTo: (targetScroll, options = {}) => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const targetP = typeof targetScroll === 'number'
          ? (targetScroll <= 1 ? targetScroll : targetScroll / maxScroll)
          : 0
        if (options.immediate) {
          scrubToProgress(targetP, true)
        } else {
          const step = Math.min(totalSteps - 1, Math.max(0, Math.round(targetP * (totalSteps - 1))))
          animateToStep(step, options.duration || 1.05)
        }
      },
      destroy: () => {
        if (tween) tween.kill()
      },
    }

    return () => {
      if (tween) tween.kill()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [totalSteps])

  return dollyRef
}
