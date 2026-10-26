import { gsap } from 'gsap'

/**
 * Lerp helper — used every frame to smooth uniform values
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Clamp
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Map a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin)
}

/**
 * Premium GSAP easing strings used throughout
 */
export const ease = {
  enter: 'power3.out',
  exit: 'power3.in',
  cinematic: 'expo.inOut',
  smooth: 'power2.inOut',
  snap: 'back.out(1.2)',
}

/**
 * Animate a GSAP target with cinematic defaults
 */
export function cinematicTo(target, vars, extraDefaults = {}) {
  return gsap.to(target, {
    duration: 0.9,
    ease: ease.cinematic,
    ...extraDefaults,
    ...vars,
  })
}

/**
 * Stagger children into view
 */
export function staggerIn(targets, delay = 0) {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 24 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: ease.enter,
      delay,
    }
  )
}
