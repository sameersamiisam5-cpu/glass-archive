import * as THREE from 'three'

/**
 * Creates ultra-high-resolution procedural canvas textures for the 3D Typographic Monoliths.
 * Generates:
 * 1. Diffuse / Color Map: Deep obsidian stone with metallic antique gold leaf letterforms and cinnabar seal.
 * 2. Bump / Relief Map: Beveled chiseled edges for real-time 3D lighting glints.
 */
export function createTypographicTextures(project) {
  const width = 1024
  const height = 1600

  // ── 1. Color / Diffuse Canvas ──────────────────────────────────────────────
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  const ctx = colorCanvas.getContext('2d')

  // Background: Deep Obsidian Lacquer
  const bgGrad = ctx.createRadialGradient(
    width * 0.5, height * 0.45, 100,
    width * 0.5, height * 0.5, width * 0.9
  )
  bgGrad.addColorStop(0, '#090d15')
  bgGrad.addColorStop(0.65, '#05070c')
  bgGrad.addColorStop(1, '#020306')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Architectural Inset Double Gold Border
  ctx.strokeStyle = 'rgba(215, 185, 125, 0.35)'
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, width - 80, height - 80)

  ctx.strokeStyle = 'rgba(215, 185, 125, 0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(52, 52, width - 104, height - 104)

  // Corner Notches (Traditional Japanese Joinery Motif)
  const notchSize = 20
  ctx.fillStyle = 'rgba(215, 185, 125, 0.55)'
  ;[
    [40, 40],
    [width - 40 - notchSize, 40],
    [40, height - 40 - notchSize],
    [width - 40 - notchSize, height - 40 - notchSize],
  ].forEach(([x, y]) => {
    ctx.fillRect(x, y, notchSize, notchSize)
  })

  // Gold Leaf Gradient for Typography
  const goldGrad = ctx.createLinearGradient(0, height * 0.2, width, height * 0.6)
  goldGrad.addColorStop(0, '#fae5b0')
  goldGrad.addColorStop(0.3, '#d8aa58')
  goldGrad.addColorStop(0.7, '#f0d28d')
  goldGrad.addColorStop(1, '#a8792c')

  // Accent Color Subtle Tint
  const accentHex = `rgba(${Math.round(project.accentColor[0] * 255)}, ${Math.round(
    project.accentColor[1] * 255
  )}, ${Math.round(project.accentColor[2] * 255)}, 0.4)`

  // Top Metadata
  ctx.textAlign = 'center'
  ctx.font = '400 24px "DM Mono", monospace'
  ctx.fillStyle = 'rgba(215, 185, 125, 0.75)'
  ctx.letterSpacing = '0.35em'
  ctx.fillText(`COLLECTION · ${project.number}`, width * 0.5, 120)

  // Subtle Accent Bar
  ctx.fillStyle = accentHex
  ctx.fillRect(width * 0.5 - 40, 142, 80, 2)

  // Monumental English Title (Cormorant Garamond)
  ctx.font = '300 132px "Cormorant Garamond", Georgia, serif'
  ctx.fillStyle = goldGrad
  ctx.shadowColor = accentHex
  ctx.shadowBlur = 35
  ctx.fillText(project.title, width * 0.5, 310)

  ctx.shadowBlur = 0 // Reset shadow

  // Horizontal Hairline Divider with Diamond
  ctx.strokeStyle = 'rgba(215, 185, 125, 0.3)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width * 0.2, 360)
  ctx.lineTo(width * 0.8, 360)
  ctx.stroke()

  ctx.fillStyle = '#d8aa58'
  ctx.fillRect(width * 0.5 - 4, 356, 8, 8)

  // Colossal Japanese Calligraphy Kanji Hero (Shippori Mincho)
  ctx.font = '700 380px "Shippori Mincho", "Yu Mincho", serif'
  ctx.fillStyle = goldGrad
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowOffsetY = 12
  ctx.shadowBlur = 24
  ctx.fillText(project.kanjiHero, width * 0.5, 780)

  ctx.shadowOffsetY = 0
  ctx.shadowBlur = 0

  // Subtitle (Poetic Narrative)
  ctx.font = '300 36px "Cormorant Garamond", Georgia, serif'
  ctx.fillStyle = 'rgba(235, 242, 255, 0.85)'
  ctx.fillText(`— ${project.subtitle} —`, width * 0.5, 910)

  // Sanctuary Provenance Inscription
  ctx.font = '400 28px "Shippori Mincho", "Yu Mincho", serif'
  ctx.fillStyle = 'rgba(215, 185, 125, 0.8)'
  ctx.fillText(project.sealInscription, width * 0.5, 980)

  // Imperial Era Registry
  ctx.font = '400 20px "DM Mono", monospace'
  ctx.fillStyle = 'rgba(165, 185, 215, 0.55)'
  ctx.fillText(project.sealEra, width * 0.5, 1030)

  // Traditional Cinnabar Red Seal Stamp (Hanko)
  const sealSize = 90
  const sealX = width * 0.5 - sealSize * 0.5
  const sealY = 1140

  ctx.save()
  // Red Lacquer Body
  const sealGrad = ctx.createRadialGradient(
    sealX + sealSize * 0.35, sealY + sealSize * 0.35, 10,
    sealX + sealSize * 0.5,  sealY + sealSize * 0.5,  sealSize * 0.8
  )
  sealGrad.addColorStop(0, '#d83a2b')
  sealGrad.addColorStop(0.7, '#a11d1d')
  sealGrad.addColorStop(1, '#680d0d')
  ctx.fillStyle = sealGrad
  ctx.fillRect(sealX, sealY, sealSize, sealSize)

  // Double border
  ctx.strokeStyle = 'rgba(255, 180, 160, 0.75)'
  ctx.lineWidth = 3
  ctx.strokeRect(sealX + 4, sealY + 4, sealSize - 8, sealSize - 8)

  // Seal Kanji
  ctx.font = '700 46px "Shippori Mincho", "Yu Mincho", serif'
  ctx.fillStyle = '#fff8f4'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(project.sealKanji, width * 0.5, sealY + sealSize * 0.52)
  ctx.restore()

  // Bottom Coordinates
  ctx.font = '400 18px "DM Mono", monospace'
  ctx.fillStyle = 'rgba(215, 185, 125, 0.45)'
  ctx.fillText(`${project.location.toUpperCase()} · 35.0116° N`, width * 0.5, 1510)

  // ── 2. Bump / Relief Canvas for 3D Chiseled Light Glints ──────────────────
  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = 512
  bumpCanvas.height = 800
  const bCtx = bumpCanvas.getContext('2d')

  // Base: Neutral flat (grey 128)
  bCtx.fillStyle = '#808080'
  bCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height)

  const scale = 512 / width
  bCtx.scale(scale, scale)

  // Emboss borders
  bCtx.strokeStyle = '#ffffff'
  bCtx.lineWidth = 4
  bCtx.strokeRect(40, 40, width - 80, height - 80)

  // Emboss Title
  bCtx.font = '300 132px "Cormorant Garamond", Georgia, serif'
  bCtx.textAlign = 'center'
  bCtx.fillStyle = '#ffffff'
  bCtx.fillText(project.title, width * 0.5, 310)

  // Emboss Kanji Hero (Deep chiseled relief)
  bCtx.font = '700 380px "Shippori Mincho", "Yu Mincho", serif'
  bCtx.fillStyle = '#ffffff'
  bCtx.fillText(project.kanjiHero, width * 0.5, 780)

  // Emboss Seal Box
  bCtx.fillStyle = '#d0d0d0'
  bCtx.fillRect(sealX, sealY, sealSize, sealSize)

  // Create Three.js Textures
  const diffuseTexture = new THREE.CanvasTexture(colorCanvas)
  diffuseTexture.generateMipmaps = true
  diffuseTexture.minFilter = THREE.LinearMipmapLinearFilter

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas)
  bumpTexture.generateMipmaps = true
  bumpTexture.minFilter = THREE.LinearMipmapLinearFilter

  return { diffuseTexture, bumpTexture }
}
