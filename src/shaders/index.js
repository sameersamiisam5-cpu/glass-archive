// ─────────────────────────────────────────────────────────────────────────────
// THE GLASS ARCHIVE — KYOTO TEMPLE NIGHT PROCEDURAL OPTICAL GLASS SHADERS
// Harmonized with Kage's Kyoto Mountain Sanctuary
// ─────────────────────────────────────────────────────────────────────────────

export const commonGLSL = /* glsl */`
#define TAU 6.28318530718

// ── Math & Noise Utilities ───────────────────────────────────────────────────
float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 74.5);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = rot * p * 2.1 + vec2(1.3, 4.2);
    a *= 0.5;
  }
  return v;
}

// Signed Distance Field for Chamfered Glass Slab
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float innerMask(vec2 uv, float corner) {
  vec2 p = uv * 2.0 - 1.0;
  float d = sdRoundBox(p, vec2(0.95, 0.95), corner);
  return 1.0 - smoothstep(-0.006, 0.006, d);
}

float bezelMask(vec2 uv, float bw, float corner) {
  float outer = innerMask(uv, corner);
  vec2 p = uv * 2.0 - 1.0;
  float d = sdRoundBox(p, vec2(0.95 - bw, 0.95 - bw), corner * 0.6);
  float inner = 1.0 - smoothstep(-0.006, 0.006, d);
  return clamp(outer - inner, 0.0, 1.0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// KYOTO TEMPLE NIGHT HOLOGRAPHIC SPECIMENS
// ═══════════════════════════════════════════════════════════════════════════════

// ── 0: TSUKI (月 · Blood Moon Totality) ──────────────────────────────────────
vec3 renderTsuki(vec2 uv, float t, vec2 pOffset, vec3 colA, vec3 colB, vec3 accent) {
  vec2 p = uv - 0.5 + pOffset * 0.10;
  float dist = length(p);

  // Blood Moon Disc
  float moonR = 0.32;
  float moonMask = 1.0 - smoothstep(moonR - 0.005, moonR + 0.005, dist);

  // Totality Crimson Corona Glow
  float corona = exp(-dist * 4.8) * 0.95 + exp(-dist * 11.0) * 0.85;

  // Dark Lunar Maria Seas inside the disc
  vec2 mP = (p / moonR) * 0.5 + 0.5;
  float maria = fbm(mP * 3.5 + vec2(0.2, 0.4)) * 0.45 + fbm(mP * 7.0 + 1.2) * 0.25;
  maria = clamp(maria, 0.0, 1.0);

  // Eclipse Limb brightening (forward scattering)
  float limb = pow(dist / moonR, 3.2) * moonMask * 0.75;

  // Subtle orbital mist & cosmic ember sparks
  float stars = 0.0;
  for (int i = 0; i < 7; i++) {
    vec2 sp = vec2(hash(vec2(float(i) * 14.2, 2.1)), hash(vec2(float(i) * 8.3, 6.7)));
    float twinkle = 0.5 + 0.5 * sin(t * 2.2 + float(i));
    stars += smoothstep(0.009, 0.0, length(uv - sp)) * twinkle;
  }

  vec3 col = colA * 1.4;
  vec3 moonAlbedo = mix(accent * 0.85, vec3(0.95, 0.75, 0.65), limb);
  moonAlbedo = mix(moonAlbedo, colA * 0.6, maria * 0.6);

  col += moonAlbedo * moonMask * 1.35;
  col += accent * corona * 0.65;
  col += vec3(1.0, 0.8, 0.7) * stars * 0.6;

  return col;
}

// ── 1: KAGE (影 · Shadow Sanctuary & Shoji Lantern) ─────────────────────────
vec3 renderKage(vec2 uv, float t, vec2 pOffset, vec3 colA, vec3 colB, vec3 accent) {
  vec2 p = uv + pOffset * 0.07;
  vec3 col = colA * 1.5;

  // Shoji paper lattice grid
  vec2 gridUV = fract(p * vec2(6.0, 10.0));
  float muntin = smoothstep(0.07, 0.0, gridUV.x) + smoothstep(0.93, 1.0, gridUV.x)
               + smoothstep(0.05, 0.0, gridUV.y) + smoothstep(0.95, 1.0, gridUV.y);
  muntin = clamp(muntin, 0.0, 1.0);

  // Candlelight flame position with organic flickering
  float flick = sin(t * 3.5) * 0.02 + sin(t * 7.8) * 0.012 + sin(t * 14.1) * 0.006;
  vec2 flamePos = vec2(0.50, 0.46) + vec2(flick * 0.5, flick);
  float flameDist = length(p - flamePos);

  // Warm golden paper lantern light diffusion
  float lanternLight = exp(-flameDist * 3.8) * 1.35 + exp(-flameDist * 7.5) * 0.95;

  // Charred Yakisugi cedar wood grain lines
  float grain = fbm(vec2(p.x * 2.5, p.y * 30.0 + t * 0.02)) * 0.18;

  // Candle flame core
  float flameCore = smoothstep(0.05, 0.0, flameDist) * 1.7;

  // Composite: light shines through shoji, blocked by dark wooden muntins
  vec3 warmLight = mix(accent, vec3(1.0, 0.92, 0.75), 0.45);
  col += warmLight * lanternLight * (1.0 - muntin * 0.75);
  col += vec3(1.0, 0.95, 0.85) * flameCore;
  col += colB * grain * (1.0 - lanternLight * 0.5);

  return col;
}

// ── 2: AME (雨 · Kyoto Downpour on Wet Slate) ────────────────────────────────
vec3 renderAme(vec2 uv, float t, vec2 pOffset, vec3 colA, vec3 colB, vec3 accent) {
  vec2 p = uv + pOffset * 0.08;
  vec3 col = colA * 1.4;

  // Vertical rain streaks running down
  float rain = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float xPos = 0.06 + fi * 0.08 + hash(vec2(fi, 1.5)) * 0.04;
    float spd = 0.7 + hash(vec2(fi, 3.2)) * 0.6;
    float len = 0.20 + hash(vec2(fi, 5.7)) * 0.35;
    float yPos = fract(-t * spd + hash(vec2(fi, 7.1)));

    float streak = smoothstep(0.0, 0.008, p.x - xPos) * smoothstep(0.0, 0.008, (xPos + 0.004) - p.x);
    float trail = smoothstep(0.0, len, p.y - yPos) * step(yPos, p.y);
    rain += streak * trail * 1.8;
  }

  // Concentric rain ripple waves
  vec2 ripCenter1 = vec2(0.38, 0.35);
  vec2 ripCenter2 = vec2(0.65, 0.60);
  float d1 = length(p - ripCenter1);
  float d2 = length(p - ripCenter2);

  float wave1 = sin(d1 * 34.0 - t * 5.0) * exp(-d1 * 4.8);
  float wave2 = sin(d2 * 28.0 - t * 4.5 + 2.0) * exp(-d2 * 4.2);
  float ripples = max(0.0, wave1) * 0.65 + max(0.0, wave2) * 0.55;

  // Wet slate paving joint grid
  float slateGrid = smoothstep(0.004, 0.0, abs(fract(p.x * 3.0) - 0.5)) * 0.15
                  + smoothstep(0.004, 0.0, abs(fract(p.y * 4.0) - 0.5)) * 0.15;

  vec3 waterTint = mix(accent, vec3(0.85, 0.95, 1.0), 0.5);
  col += waterTint * (rain * 0.9 + ripples * 0.9);
  col += vec3(0.4, 0.6, 0.8) * slateGrid;

  return col;
}

// ── 3: TORII (鳥居 · Vermilion Lacquer & Incense Smoke) ──────────────────────
vec3 renderTorii(vec2 uv, float t, vec2 pOffset, vec3 colA, vec3 colB, vec3 accent) {
  vec2 p = uv + pOffset * 0.08;
  vec3 col = colA * 1.4;

  // Sacred Torii Gate silhouette
  float kasagiCurve = (p.x - 0.5) * (p.x - 0.5) * 0.18;
  float topBeam = smoothstep(0.022, 0.0, abs(p.y - 0.78 - kasagiCurve)) * step(0.12, p.x) * step(p.x, 0.88);
  float nuki = smoothstep(0.016, 0.0, abs(p.y - 0.66)) * step(0.18, p.x) * step(p.x, 0.82);

  float pillarL = smoothstep(0.024, 0.0, abs(p.x - 0.32)) * step(0.12, p.y) * step(p.y, 0.78);
  float pillarR = smoothstep(0.024, 0.0, abs(p.x - 0.68)) * step(0.12, p.y) * step(p.y, 0.78);
  float toriiStructure = max(max(topBeam, nuki), max(pillarL, pillarR));

  float cracks = fbm(p * 24.0) * 0.25;
  float smoke1 = fbm(vec2(p.x * 4.0 + sin(t * 0.8 + p.y * 3.0) * 0.3, p.y * 2.5 - t * 0.4)) * 0.35;
  float smoke2 = fbm(vec2(p.x * 6.0 - cos(t * 0.6 + p.y * 4.0) * 0.25, p.y * 3.0 - t * 0.5 + 2.0)) * 0.25;
  float incense = smoothstep(0.2, 0.7, smoke1 + smoke2) * (1.0 - p.y * 0.6);

  float goldCaps = (smoothstep(0.022, 0.0, abs(p.x - 0.32)) + smoothstep(0.022, 0.0, abs(p.x - 0.68)))
                 * smoothstep(0.016, 0.0, abs(p.y - 0.13)) * 1.5;

  vec3 toriiCol = mix(accent, vec3(0.85, 0.25, 0.15), cracks);
  col += toriiCol * toriiStructure * 1.45;
  col += vec3(1.0, 0.85, 0.4) * goldCaps;
  col += mix(vec3(0.7, 0.75, 0.85), accent * 0.5, 0.3) * incense * 0.75;

  return col;
}

// ── 4: MOMIJI (紅葉 · Japanese Maple & Moss Garden) ──────────────────────────
float sdMapleLeaf(vec2 p, float scale) {
  p /= scale;
  float r = length(p);
  if (r > 1.2) return 1.0;
  float a = atan(p.y, p.x);
  float lobe5 = abs(cos(a * 2.5));
  float serrate = sin(a * 20.0) * 0.04;
  float radius = 0.55 + 0.38 * lobe5 + serrate;
  return r - radius;
}

vec3 renderMomiji(vec2 uv, float t, vec2 pOffset, vec3 colA, vec3 colB, vec3 accent) {
  vec2 p = uv + pOffset * 0.08;
  vec3 col = colA * 1.3;

  float leaves = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float windSpeed = 0.18 + fi * 0.04;
    float lx = fract(t * windSpeed * 0.4 + hash(vec2(fi, 1.7)) * 0.8);
    float ly = 0.25 + fi * 0.14 + sin(t * 1.2 + fi * 2.0) * 0.08;
    float leafRot = t * (0.8 + fi * 0.3) + fi * 1.5;

    vec2 lP = p - vec2(lx, ly);
    mat2 rotM = mat2(cos(leafRot), -sin(leafRot), sin(leafRot), cos(leafRot));
    lP = rotM * lP;

    float leafDist = sdMapleLeaf(lP, 0.14 + fi * 0.015);
    float leafMask = 1.0 - smoothstep(0.0, 0.015, leafDist);
    leaves += leafMask;
  }

  float moss = fbm(p * 8.0 - t * 0.03) * 0.35 + fbm(p * 18.0) * 0.15;
  vec3 mossCol = vec3(0.18, 0.48, 0.28) * moss;
  float windStreak = fbm(vec2(p.x * 2.0 - t * 0.6, p.y * 6.0)) * 0.12;

  col += mossCol * 0.7;
  col += accent * clamp(leaves, 0.0, 1.0) * 1.5;
  col += vec3(0.8, 0.9, 1.0) * windStreak * 0.4;

  return col;
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// MUSEUM RELIC VITRINE: OPTICAL GLASS CLOCHE SHADERS
// Harmonized with Kyoto Temple Night (Dark Obsidian Optical Glass)
// ═══════════════════════════════════════════════════════════════════════════════

export const vitrineGlassVertexShader = /* glsl */`
uniform float uTime;
uniform float uHover;
uniform float uSelected;

varying vec2  vUv;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;
varying float vDepth;

void main() {
  vUv = uv;

  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp      = modelMatrix * vec4(position, 1.0);
  vWorldPos    = wp.xyz;

  vViewDir     = normalize(cameraPosition - vWorldPos);

  // High-index optical Fresnel: steep falloff so front is ultra-transparent
  float NdotV  = clamp(abs(dot(vWorldNormal, vViewDir)), 0.0, 1.0);
  vFresnel     = pow(1.0 - NdotV, 3.8);

  vec4 mv      = modelViewMatrix * vec4(position, 1.0);
  vDepth       = clamp(-mv.z / 28.0, 0.0, 1.0);

  gl_Position  = projectionMatrix * mv;
}
`

export const vitrineGlassFragmentShader = /* glsl */`
precision highp float;

uniform float uTime;
uniform float uHover;
uniform float uSelected;
uniform float uActive;
uniform vec3  uAccentColor;
uniform float uOpacity;
uniform float uDim;

varying vec2  vUv;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;
varying float vDepth;

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // 1. Cold Kyoto Moonlight Reflection from top-right (matching Temple key light)
  vec3 moonDir = normalize(vec3(0.35, 1.2, 0.6));
  vec3 halfM   = normalize(moonDir + vViewDir);
  float moonSpec = pow(max(0.0, dot(vWorldNormal, halfM)), 48.0);
  vec3 moonGleam = vec3(0.68, 0.82, 0.90) * moonSpec * (0.65 + uHover * 0.35);

  // 2. Warm Temple Shoji Lantern Bounce from down-left (matching temple courtyard lanterns)
  vec3 lanternDir = normalize(vec3(-0.65, -0.35, 0.5));
  vec3 halfL      = normalize(lanternDir + vViewDir);
  float lanternSpec = pow(max(0.0, dot(vWorldNormal, halfL)), 36.0);
  vec3 lanternGleam = vec3(0.95, 0.55, 0.22) * lanternSpec * (0.40 + uHover * 0.25);

  // 3. Razor-thin Grazing Fresnel Rim (Cold slate moon with subtle accent tint)
  vec3 grazingColor = mix(vec3(0.58, 0.75, 0.86), uAccentColor, 0.30) * vFresnel * (0.85 + uHover * 0.4);

  // 4. Subtle Bevel Polish at Top and Bottom Joinery
  float lip = smoothstep(0.96, 1.0, uv.y) + smoothstep(0.04, 0.0, uv.y);
  vec3 lipShine = mix(vec3(0.7, 0.8, 0.9), vec3(0.85, 0.70, 0.40), 0.4) * lip * 0.35;

  // 5. Deep Obsidian Optical Transmission Tint (whisper dark quartz, never cloudy)
  vec3 glassBase = vec3(0.012, 0.018, 0.026);

  vec3 finalColor = glassBase + grazingColor + moonGleam + lanternGleam + lipShine;

  // Atmospheric integration
  finalColor *= (1.0 - vDepth * 0.25);
  finalColor *= (1.0 - uDim * 0.75);

  // Ultra-crisp transmission: center facing camera has ~0.03 alpha (97% crystal clear)!
  // Grazing edges catch the authentic moon and lantern glints.
  float alpha = clamp(0.035 + vFresnel * 0.42 + moonSpec * 0.65 + lanternSpec * 0.45 + lip * 0.30, 0.0, 0.82);
  alpha *= uOpacity * (1.0 - uDim * 0.55);

  gl_FragColor = vec4(finalColor, alpha);
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// SACRED 3D ARTIFACT RELIC SHADERS (LEVITATING INSIDE VITRINE)
// Harmonized with Kyoto Sanctuary Moonlight & Warm Shoji Candlelight
// ═══════════════════════════════════════════════════════════════════════════════

export const relicVertexShader = /* glsl */`
uniform float uTime;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;

varying vec2  vUv;
varying vec3  vNormal;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;

void main() {
  vUv = uv;
  vNormal = normal;

  vec3 p = position;

  // Fluid drag inertia along Y when scrolling through the archive
  float fluidDrag = -uScrollVelocity * 0.045 * (1.0 - smoothstep(0.0, 1.2, abs(p.y)));
  p.y += fluidDrag;

  // Soft sleeping respiration pulse along surface normal
  float breath = sin(uTime * 1.5 + p.y * 2.2) * 0.007 * (1.0 + uHover * 0.45);
  p += normal * breath;

  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp      = modelMatrix * vec4(p, 1.0);
  vWorldPos    = wp.xyz;
  vViewDir     = normalize(cameraPosition - vWorldPos);

  float NdotV  = clamp(dot(vWorldNormal, vViewDir), 0.0, 1.0);
  vFresnel     = pow(1.0 - NdotV, 3.2);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

export const relicFragmentShader = /* glsl */`
precision highp float;

uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;
uniform float uActive;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uAccentColor;
uniform float uOpacity;
uniform float uVariant;   // 0: TSUKI, 1: KAGE, 2: AME, 3: TORII, 4: MOMIJI
uniform float uDim;

varying vec2  vUv;
varying vec3  vNormal;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;

${commonGLSL}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  // View-space parallax micro-shift
  vec2 pOffset = vViewDir.xy * 0.09;

  // Render elemental procedural relic surface
  int v = int(uVariant + 0.5);
  vec3 surfCol;
  if (v == 0) {
    surfCol = renderTsuki(uv, t, pOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 1) {
    surfCol = renderKage(uv, t, pOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 2) {
    surfCol = renderAme(uv, t, pOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 3) {
    surfCol = renderTorii(uv, t, pOffset, uColorA, uColorB, uAccentColor);
  } else {
    surfCol = renderMomiji(uv, t, pOffset, uColorA, uColorB, uAccentColor);
  }

  // 1. Natural Self-Illuminated Core (Sacred treasure glowing in the night)
  vec3 coreArt = surfCol * (0.80 + uActive * 0.20 + uHover * 0.15);

  // 2. Kyoto Night Moonlight Direction (Matching Temple Key Light: top-right)
  vec3 moonDir   = normalize(vec3(0.40, 1.15, 0.45));
  float NdotMoon = clamp(dot(vWorldNormal, moonDir), 0.0, 1.0);
  vec3 moonTint  = vec3(0.72, 0.86, 0.94);

  // 3. Warm Temple Paper Shoji Lantern Bounce (from lower-left courtyard)
  vec3 lanternDir   = normalize(vec3(-0.65, -0.40, 0.55));
  float NdotLantern = clamp(dot(vWorldNormal, lanternDir), 0.0, 1.0);
  vec3 warmLantern  = vec3(0.98, 0.56, 0.22) * NdotLantern * 0.32;

  // 4. Tight Specular Catchlight (subtle & toned to accent, never blown-out white)
  vec3 halfVec  = normalize(moonDir + vViewDir);
  float spec    = pow(max(0.0, dot(vWorldNormal, halfVec)), 42.0);
  vec3 specularCatch = mix(uAccentColor, moonTint, 0.45) * spec * (0.45 + uHover * 0.35);

  // 5. Blood Moon Totality Grazing Rim
  vec3 rimLight = mix(moonTint, uAccentColor, 0.45) * vFresnel * (0.55 + uHover * 0.35 + uActive * 0.25);

  // 6. Subsurface Emissive Hearth Glow
  vec3 emissive = uAccentColor * (0.16 + uHover * 0.22 + uSelected * 0.45) * (0.9 + 0.1 * sin(t * 2.2));

  // Synthesize Harmonized Sanctuary Palette
  vec3 finalColor = coreArt * mix(0.70, 1.0, NdotMoon) + rimLight + warmLantern + specularCatch + emissive;
  finalColor *= (1.0 - uDim * 0.75);

  gl_FragColor = vec4(finalColor, clamp(uOpacity, 0.0, 1.0));
}
`

// ═══════════════════════════════════════════════════════════════════════════════
// BACKWARD-COMPATIBLE CHAMFERED GLASS SLAB SHADERS
// ═══════════════════════════════════════════════════════════════════════════════

export const glassVertexShader = /* glsl */`
uniform float uTime;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;
uniform vec2  uMouse;

varying vec2  vUv;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;
varying float vDepth;

void main() {
  vUv = uv;

  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vec4 wp      = modelMatrix * vec4(position, 1.0);
  vWorldPos    = wp.xyz;

  vViewDir     = normalize(cameraPosition - vWorldPos);

  float NdotV  = clamp(dot(vWorldNormal, vViewDir), 0.0, 1.0);
  vFresnel     = pow(1.0 - NdotV, 3.6);

  vec4 mv      = modelViewMatrix * vec4(position, 1.0);
  vDepth       = clamp(-mv.z / 26.0, 0.0, 1.0);

  vec3 pos = position;
  float inertia = sin(pos.x * 2.5 + pos.y * 1.8 + uTime * 2.0) * 0.012 * uScrollVelocity;
  float hoverWave = sin(pos.x * 3.2 - pos.y * 2.4 + uTime * 2.6) * 0.008 * uHover;
  pos.z += inertia + hoverWave;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const glassFragmentShader = /* glsl */`
precision highp float;

uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;
uniform float uActive;
uniform vec2  uMouse;
uniform vec2  uResolution;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform vec3  uAccentColor;
uniform float uOpacity;
uniform float uVariant;
uniform float uDim;

varying vec2  vUv;
varying vec3  vWorldNormal;
varying vec3  vWorldPos;
varying vec3  vViewDir;
varying float vFresnel;
varying float vDepth;

${commonGLSL}

void main() {
  vec2 uv = vUv;
  float t = uTime;

  float isSide = step(abs(vWorldNormal.z), 0.65);
  if (isSide > 0.5) {
    vec3 edgeBase = mix(uColorA * 2.2, uColorB * 2.8, uv.y);
    float edgeSpecular = pow(vFresnel, 2.0) * 1.6 + 0.22;
    vec3 edgeColor = edgeBase + uAccentColor * edgeSpecular * 0.7 + vec3(edgeSpecular * 0.35);
    gl_FragColor = vec4(edgeColor * (1.0 - uDim * 0.55), clamp(uOpacity * 0.96, 0.0, 1.0));
    return;
  }

  float corner = 0.08;
  float slabMask = innerMask(uv, corner);
  if (slabMask < 0.01) discard;

  vec3 eyeRay = normalize(vWorldPos - cameraPosition);
  vec2 internalShift = eyeRay.xy * 0.16 + (uMouse - 0.5) * 0.08;
  vec2 parallaxOffset = internalShift + (uv - 0.5) * 0.05;

  float dispersion = 0.018 + uScrollVelocity * 0.04 + uHover * 0.02 + uSelected * 0.03;
  vec2 uvR = uv + parallaxOffset * dispersion * 2.0;
  vec2 uvG = uv + parallaxOffset * dispersion * 1.0;
  vec2 uvB = uv - parallaxOffset * dispersion * 1.8;

  int v = int(uVariant + 0.5);
  vec3 rPass, gPass, bPass;

  if (v == 0) {
    rPass = renderTsuki(uvR, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    gPass = renderTsuki(uvG, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    bPass = renderTsuki(uvB, t, parallaxOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 1) {
    rPass = renderKage(uvR, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    gPass = renderKage(uvG, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    bPass = renderKage(uvB, t, parallaxOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 2) {
    rPass = renderAme(uvR, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    gPass = renderAme(uvG, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    bPass = renderAme(uvB, t, parallaxOffset, uColorA, uColorB, uAccentColor);
  } else if (v == 3) {
    rPass = renderTorii(uvR, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    gPass = renderTorii(uvG, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    bPass = renderTorii(uvB, t, parallaxOffset, uColorA, uColorB, uAccentColor);
  } else {
    rPass = renderMomiji(uvR, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    gPass = renderMomiji(uvG, t, parallaxOffset, uColorA, uColorB, uAccentColor);
    bPass = renderMomiji(uvB, t, parallaxOffset, uColorA, uColorB, uAccentColor);
  }

  vec3 internalHologram = vec3(rPass.r, gPass.g, bPass.b);

  vec3 substrate = mix(uColorA, uColorB, uv.y * 0.7 + uv.x * 0.3);
  substrate = mix(vec3(0.015, 0.018, 0.025), substrate, 0.7);

  vec3 glassBody = substrate + internalHologram * (0.85 + uActive * 0.25 + uHover * 0.18 + uSelected * 0.35);

  float diagSweep = uv.x * 0.6 + uv.y * 0.5 + t * 0.06;
  float specularSweep = smoothstep(0.0, 0.18, fract(diagSweep)) * (1.0 - smoothstep(0.18, 0.45, fract(diagSweep)));
  specularSweep = pow(specularSweep, 6.0) * (0.12 + uHover * 0.12 + uActive * 0.08);

  float bw = 0.024;
  float bezel = bezelMask(uv, bw, corner);
  vec2 norm2D = normalize(uv * 2.0 - 1.0);
  float bezelLighting = clamp(dot(norm2D, vec2(-0.7, 0.7)) * 0.5 + 0.5, 0.0, 1.0);
  vec3 bezelCol = mix(vec3(0.65, 0.70, 0.85), uAccentColor * 0.6 + 0.4, 0.35);
  vec3 bezelShine = bezelCol * (0.6 + bezelLighting * 0.6 + uHover * 0.35 + uSelected * 0.45) * bezel;

  float rimPower = 0.35 + uActive * 0.25 + uHover * 0.22 + uSelected * 0.35;
  vec3 rimGlow = mix(vec3(0.8, 0.9, 1.0), uAccentColor, 0.45) * vFresnel * rimPower;

  float surfaceGrain = noise(uv * 120.0 + t * 1.5) * 0.02;
  float caustics = fbm(uv * 8.0 - t * 0.2) * 0.04 * (uHover + 0.3);

  float depthFactor = 1.0 - vDepth * 0.32;
  vec3 finalColor = (glassBody + vec3(specularSweep) + bezelShine + rimGlow + caustics + surfaceGrain) * depthFactor;
  finalColor *= (1.0 + uActive * 0.15 + uSelected * 0.25);
  finalColor *= (1.0 - uDim * 0.70);
  float finalAlpha = clamp(uOpacity * slabMask, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`
