import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────────
// SACRED RELIC PROCEDURAL GEOMETRIES FOR MUSEUM VITRINES
// Authentic Japanese iconography, sculpted architectural forms, and strict
// vitrine envelope containment (max radius 0.92, max height 2.10)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Helper to merge an array of geometries into a single BufferGeometry
 */
function mergeBufferGeometries(geometries) {
  let totalPositions = 0
  let totalNormals = 0
  let totalUvs = 0
  let totalIndices = 0

  geometries.forEach(geo => {
    totalPositions += geo.attributes.position.count * 3
    if (geo.attributes.normal) totalNormals += geo.attributes.normal.count * 3
    if (geo.attributes.uv) totalUvs += geo.attributes.uv.count * 2
    if (geo.index) totalIndices += geo.index.count
    else totalIndices += geo.attributes.position.count
  })

  const mergedPos = new Float32Array(totalPositions)
  const mergedNor = new Float32Array(totalNormals)
  const mergedUv  = new Float32Array(totalUvs)
  const mergedIdx = totalPositions / 3 > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices)

  let posOffset = 0
  let norOffset = 0
  let uvOffset  = 0
  let idxOffset = 0
  let vertexOffset = 0

  geometries.forEach(geo => {
    const pos = geo.attributes.position.array
    mergedPos.set(pos, posOffset)
    posOffset += pos.length

    if (geo.attributes.normal) {
      const nor = geo.attributes.normal.array
      mergedNor.set(nor, norOffset)
      norOffset += nor.length
    }

    if (geo.attributes.uv) {
      const uv = geo.attributes.uv.array
      mergedUv.set(uv, uvOffset)
      uvOffset += uv.length
    }

    const count = geo.attributes.position.count
    if (geo.index) {
      const idx = geo.index.array
      for (let i = 0; i < idx.length; i++) {
        mergedIdx[idxOffset + i] = idx[i] + vertexOffset
      }
      idxOffset += idx.length
    } else {
      for (let i = 0; i < count; i++) {
        mergedIdx[idxOffset + i] = i + vertexOffset
      }
      idxOffset += count
    }

    vertexOffset += count
    geo.dispose()
  })

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3))
  if (norOffset > 0) merged.setAttribute('normal', new THREE.BufferAttribute(mergedNor, 3))
  if (uvOffset > 0) merged.setAttribute('uv', new THREE.BufferAttribute(mergedUv, 2))
  merged.setIndex(new THREE.BufferAttribute(mergedIdx, 1))
  merged.computeVertexNormals()
  return merged
}

// ── 0: TSUKI (月 · Blood Moon Orb with Armillary Celestial Gimbals) ───────────
// Bounding envelope: radius 0.88, height 1.76 (fits safely in 1.38r vitrine)
export function createTsukiGeometry() {
  const parts = []

  // 1. Main lunar sphere with sculpted crater topography
  const sphere = new THREE.SphereGeometry(0.66, 44, 44)
  const pos = sphere.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const len = Math.hypot(x, y, z)
    // Tycho-style lunar craters and maria depressions
    const crater1 = Math.sin(x * 6.8) * Math.cos(y * 5.8 + z * 4.2) * 0.020
    const crater2 = Math.sin(x * 15.0 + y * 12.0) * Math.cos(z * 14.0) * 0.010
    const highland = Math.sin(y * 3.4) * 0.012
    const factor = (len + crater1 + crater2 + highland) / len
    pos.setXYZ(i, x * factor, y * factor, z * factor)
  }
  parts.push(sphere)

  // 2. Primary celestial meridian gimbal ring
  const ring1 = new THREE.TorusGeometry(0.88, 0.016, 16, 64)
  ring1.rotateX(Math.PI / 3)
  ring1.rotateZ(Math.PI / 6)
  parts.push(ring1)

  // 3. Secondary equatorial gimbal ring
  const ring2 = new THREE.TorusGeometry(0.78, 0.014, 16, 64)
  ring2.rotateX(-Math.PI / 4)
  ring2.rotateY(Math.PI / 3)
  parts.push(ring2)

  // 4. Celestial pivot pins at poles
  ;[-1, 1].forEach(side => {
    const pin = new THREE.CylinderGeometry(0.022, 0.022, 0.24, 12)
    pin.translate(0, side * 0.74, 0)
    parts.push(pin)
  })

  return mergeBufferGeometries(parts)
}

// ── 1: KAGE (影 · Kyoto Sanctuary Pagoda Lantern / Tōrō) ─────────────────────
// Bounding envelope: radius 0.72, height 1.82 (fits safely in 1.38r vitrine)
export function createKageGeometry() {
  const parts = []

  // 1. Hexagonal stepped pedestal base (Jigoe & Kiso)
  const base1 = new THREE.CylinderGeometry(0.48, 0.58, 0.14, 6)
  base1.translate(0, -0.74, 0)
  parts.push(base1)

  const base2 = new THREE.CylinderGeometry(0.40, 0.48, 0.10, 6)
  base2.translate(0, -0.62, 0)
  parts.push(base2)

  // 2. Standard shaft (Sao)
  const shaft = new THREE.CylinderGeometry(0.24, 0.28, 0.22, 6)
  shaft.translate(0, -0.46, 0)
  parts.push(shaft)

  // 3. Middle platform (Nakadai) with flared rim
  const nakadai = new THREE.CylinderGeometry(0.48, 0.36, 0.10, 6)
  nakadai.translate(0, -0.30, 0)
  parts.push(nakadai)

  // 4. Light chamber (Hibukuro) with 6 corner posts
  const pillarRadius = 0.38
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2
    const px = Math.cos(angle) * pillarRadius
    const pz = Math.sin(angle) * pillarRadius
    const pillar = new THREE.BoxGeometry(0.045, 0.68, 0.045)
    pillar.rotateY(-angle)
    pillar.translate(px, 0.09, pz)
    parts.push(pillar)
  }

  // 5. Translucent Shoji screen cylinder (Paper chamber inside)
  const screen = new THREE.CylinderGeometry(0.35, 0.35, 0.65, 24, 1, true)
  screen.translate(0, 0.09, 0)
  parts.push(screen)

  // 6. Upper lintel collar
  const collar = new THREE.CylinderGeometry(0.44, 0.40, 0.08, 6)
  collar.translate(0, 0.46, 0)
  parts.push(collar)

  // 7. Flared Pagoda Hip Roof (Kasa) with upturned temple eave corners
  const roof = new THREE.CylinderGeometry(0.10, 0.66, 0.28, 6)
  const rPos = roof.attributes.position
  for (let i = 0; i < rPos.count; i++) {
    const y = rPos.getY(i)
    if (y < 0) {
      const x = rPos.getX(i), z = rPos.getZ(i)
      const d = Math.hypot(x, z)
      rPos.setXYZ(i, x * 1.08, y + 0.035 * (d / 0.66), z * 1.08)
    }
  }
  roof.translate(0, 0.64, 0)
  parts.push(roof)

  // 8. Sacred Lotus Bud Finial (Hōju jewel crown)
  const jewel = new THREE.SphereGeometry(0.08, 16, 16)
  jewel.scale(1, 1.45, 1)
  jewel.translate(0, 0.88, 0)
  parts.push(jewel)

  return mergeBufferGeometries(parts)
}

// ── 2: AME (雨 · Fluid Water Droplet with Surface Tension Waves) ─────────────
// Bounding envelope: radius 0.78, height 1.84 (fits safely in 1.38r vitrine)
export function createAmeGeometry() {
  const parts = []

  // Mathematical cohesive teardrop lathe profile
  const points = []
  const segments = 44
  for (let i = 0; i <= segments; i++) {
    const u = i / segments // 0 (bottom) to 1 (top)
    const y = (u - 0.48) * 1.70 // -0.82 to +0.88

    // Fluid teardrop profile: wide cohesive lower belly tapering to cohesive tip
    let r = Math.sin(Math.PI * u) * Math.pow(Math.max(0.001, 1.0 - u * 0.72), 0.44) * 0.68

    // Organic fluid capillary wave crests running down the body
    const ripple = Math.sin(u * 20.0) * 0.010 * Math.sin(Math.PI * u)
    r = Math.max(0.002, r + ripple)

    points.push(new THREE.Vector2(r, y))
  }

  const droplet = new THREE.LatheGeometry(points, 44)
  parts.push(droplet)

  // 1. Primary concentric fluid ripple ring suspended at lower waist
  const ripple1 = new THREE.TorusGeometry(0.76, 0.011, 16, 48)
  ripple1.rotateX(Math.PI / 2)
  ripple1.translate(0, -0.45, 0)
  parts.push(ripple1)

  // 2. Secondary delicate capillary wave ring
  const ripple2 = new THREE.TorusGeometry(0.55, 0.009, 16, 48)
  ripple2.rotateX(Math.PI / 2)
  ripple2.translate(0, -0.65, 0)
  parts.push(ripple2)

  // 3. Suspended micro-droplet hovering just above the apex
  const microDrop = new THREE.SphereGeometry(0.05, 16, 16)
  microDrop.scale(1, 1.3, 1)
  microDrop.translate(0, 0.98, 0)
  parts.push(microDrop)

  return mergeBufferGeometries(parts)
}

// ── 3: TORII (鳥居 · Sacred Vermilion Torii Shrine Architecture) ─────────────
// Bounding envelope: width 1.44 (half 0.72), depth 0.28, height 1.78
// Fits comfortably inside 1.38 radius vitrine!
export function createToriiGeometry() {
  const parts = []

  // 1. Kasagi & Shimaki (Curved Top Beam with Sori flair)
  const kasagi = new THREE.BoxGeometry(1.44, 0.14, 0.16, 16, 1, 1)
  const kPos = kasagi.attributes.position
  for (let i = 0; i < kPos.count; i++) {
    const x = kPos.getX(i)
    // Parabolic upward curvature of Japanese Torii Kasagi tips
    const curve = Math.pow(x / 0.72, 2.0) * 0.075
    kPos.setY(i, kPos.getY(i) + curve)
  }
  kasagi.translate(0, 0.68, 0)
  parts.push(kasagi)

  // Shimaki sub-lintel directly under Kasagi
  const shimaki = new THREE.BoxGeometry(1.30, 0.09, 0.14)
  shimaki.translate(0, 0.58, 0)
  parts.push(shimaki)

  // 2. Nuki (Lower Horizontal Crossbeam extending through pillars)
  const nuki = new THREE.BoxGeometry(1.22, 0.10, 0.11)
  nuki.translate(0, 0.32, 0)
  parts.push(nuki)

  // Wooden wedges (Kusabi) on outer edges of Nuki
  ;[-1, 1].forEach(side => {
    const wedge = new THREE.BoxGeometry(0.03, 0.14, 0.13)
    wedge.translate(side * 0.44, 0.32, 0)
    parts.push(wedge)
  })

  // 3. Central Gakuzuka Tablet Plaque Strut
  const gakuzuka = new THREE.BoxGeometry(0.11, 0.18, 0.065)
  gakuzuka.translate(0, 0.45, 0)
  parts.push(gakuzuka)

  // 4. Twin Pillars (Hashira) with authentic 1.8° inward rake (Uchi-korobi)
  const pillarDistance = 0.38
  ;[-1, 1].forEach(side => {
    const pillar = new THREE.CylinderGeometry(0.072, 0.082, 1.48, 18)
    pillar.rotateZ(-side * 0.032)
    pillar.translate(side * pillarDistance, -0.15, 0)
    parts.push(pillar)

    // Stone base plinth drums (Kamebara / Nemaki)
    const plinth = new THREE.CylinderGeometry(0.11, 0.13, 0.14, 18)
    plinth.translate(side * (pillarDistance + 0.024), -0.82, 0)
    parts.push(plinth)
  })

  return mergeBufferGeometries(parts)
}

// ── 4: MOMIJI (紅葉 · Multi-Layered Sculpted Japanese Maple Leaf Gem) ────────
// Bounding envelope: radius 0.78, height 1.76 (fits safely in 1.38r vitrine)
export function createMomijiGeometry() {
  const parts = []

  // Analytical 5-lobed Japanese Maple Leaf generator function
  function buildMapleLeafGeometry(scale, rotZ, tiltX, posX, posY, posZ) {
    const shape = new THREE.Shape()
    const points = 72

    for (let i = 0; i <= points; i++) {
      const a = (i / points) * Math.PI * 2
      const lobe5 = Math.abs(Math.cos(a * 2.5))
      const serrate = Math.sin(a * 22.0) * 0.032
      const stemCleft = 1.0 - Math.exp(-Math.pow((a - Math.PI * 1.5) / 0.4, 2) * 8.0) * 0.65
      const r = (0.48 + 0.40 * lobe5 + serrate) * stemCleft * scale

      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    }

    const extrudeSettings = {
      depth: 0.030 * scale,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015 * scale,
      bevelThickness: 0.012 * scale,
    }
    const leafGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)

    // Curvature: delicate 3D cupping curl along central vein
    const pos = leafGeo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i)
      const dist = Math.hypot(x, y)
      const curl = Math.pow(dist / scale, 1.8) * 0.07 * scale
      pos.setZ(i, pos.getZ(i) - curl)
    }
    leafGeo.computeVertexNormals()

    leafGeo.rotateX(tiltX)
    leafGeo.rotateZ(rotZ)
    leafGeo.translate(posX, posY, posZ)
    return leafGeo
  }

  // 1. Primary Hero Maple Leaf
  parts.push(buildMapleLeafGeometry(0.78, 0.25, 0.30, 0.0, -0.05, 0.0))

  // 2. Secondary Complementary Maple Leaf folded underneath
  parts.push(buildMapleLeafGeometry(0.56, -0.72, -0.24, -0.18, 0.18, -0.10))

  // 3. Delicate curved branch twig stem connecting both leaves
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, -0.45, 0.0),
    new THREE.Vector3(-0.04, -0.25, -0.02),
    new THREE.Vector3(-0.02, -0.05, 0.0),
    new THREE.Vector3(-0.10, 0.14, -0.06),
  ])
  const stem = new THREE.TubeGeometry(stemCurve, 16, 0.018, 8, false)
  parts.push(stem)

  // 4. Faceted crystal dewdrop gem resting on leaf surface
  const dewdrop = new THREE.IcosahedronGeometry(0.10, 1)
  dewdrop.translate(0.16, 0.06, 0.07)
  parts.push(dewdrop)

  return mergeBufferGeometries(parts)
}

// ── Obsidian Plinth Platform (Resting inside the vitrine) ───────────────────
export function createPlinthGeometry() {
  const parts = []
  // Black obsidian stone plinth dais
  const dais = new THREE.CylinderGeometry(1.15, 1.24, 0.18, 36)
  dais.translate(0, -1.95, 0)
  parts.push(dais)

  // Inset gold rim on stone dais
  const ring = new THREE.TorusGeometry(1.16, 0.015, 16, 48)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, -1.86, 0)
  parts.push(ring)

  return mergeBufferGeometries(parts)
}
