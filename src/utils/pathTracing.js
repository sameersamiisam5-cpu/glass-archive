/**
 * Single Path Tracing Engine — Kyoto Sanctuary Uncut Dolly System
 * Computes smooth, continuous camera-path interpolation for typography and UI elements.
 */

export function getPathTraceStyle(idx, track, options = {}) {
  const {
    driftY = 16,
    maxBlur = 4.0,
    baseBlur = 0.0,
    dwell = 0.25,
    corridor = 0.50,
    baseOpacity = 1.0,
    scaleFactor = 0.025,
    blurOnly = false,
  } = options

  const d = track - idx // distance along continuous camera track
  const absD = Math.abs(d)
  const maxRange = dwell + corridor // boundary where layer becomes completely inactive (0.75)

  if (absD >= maxRange) {
    return {
      display: 'none',
      opacity: 0,
      visibility: 'hidden',
    }
  }

  let progress = 0
  let fade = 1.0

  if (absD <= dwell) {
    fade = 1.0
    progress = 0
  } else {
    progress = (absD - dwell) / corridor // 0.0 to 1.0
    if (blurOnly) {
      // Do NOT dim the text — keep full brightness and transition through heavy optical blur
      fade = progress < 0.82 ? 1.0 : (1 + Math.cos(((progress - 0.82) / 0.18) * Math.PI)) / 2
    } else {
      // Continuous cosine ease for standard morph
      fade = (1 + Math.cos(progress * Math.PI)) / 2
    }
  }

  const y = -d * driftY
  const blur = baseBlur + progress * maxBlur
  const scale = 1.0 - progress * scaleFactor
  const opacity = fade * baseOpacity

  return {
    opacity: Number(opacity.toFixed(3)),
    visibility: opacity <= 0.005 ? 'hidden' : 'visible',
    display: opacity <= 0.005 ? 'none' : 'block',
    filter: blur > 0.08 ? `blur(${blur.toFixed(1)}px)` : 'none',
    transform: `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
    willChange: 'transform, opacity, filter',
  }
}
