uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;
uniform vec2 uMouse;
uniform vec2 uResolution;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uAccentColor;
uniform float uOpacity;
uniform float uActive;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vFresnel;

// ── Noise helpers ─────────────────────────────────────────────────────────────
vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec2 mod289(vec2 x){ return x - floor(x*(1.0/289.0))*289.0; }
vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187,
                      0.366025403784439,
                     -0.577350269189626,
                      0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                         + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0*fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x  = a0.x*x0.x  + h.x*x0.y;
  g.yz = a0.yz*x12.xz + h.yz*x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  vec2  shift = vec2(100.0);
  mat2  rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for(int i=0;i<4;i++){
    v += a * snoise(p);
    p  = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

// ── Main ──────────────────────────────────────────────────────────────────────
void main(){
  vec2 uv = vUv;

  // ── Distortion from scroll velocity ──
  float distort = uScrollVelocity * 0.06;
  vec2 distUv = uv + vec2(
    snoise(uv * 3.0 + uTime * 0.4) * distort,
    snoise(uv * 3.0 + uTime * 0.4 + 5.2) * distort
  );

  // ── Base internal gradient ──
  float gradY = smoothstep(0.0, 1.0, uv.y);
  vec3 baseColor = mix(uColorA * 0.6, uColorB * 0.8, gradY);

  // ── FBM texture ──
  float t = uTime * 0.12;
  float n1 = fbm(distUv * 2.4 + t);
  float n2 = fbm(distUv * 4.0 - t * 0.7 + 3.1);
  float noiseMix = n1 * 0.6 + n2 * 0.4;
  baseColor += uAccentColor * noiseMix * 0.07;

  // ── Reflection band ──
  float band = sin(uv.y * 6.0 - uTime * 0.8 + uScroll * 2.0) * 0.5 + 0.5;
  band = pow(band, 6.0);
  float bandH = sin(uv.x * 4.0 + uTime * 0.5) * 0.5 + 0.5;
  bandH = pow(bandH, 8.0);
  vec3 reflection = uAccentColor * (band * 0.15 + bandH * 0.08);

  // ── Hover shimmer ──
  float hoverShimmer = sin(uv.x * 8.0 + uv.y * 5.0 + uTime * 3.0) * 0.5 + 0.5;
  hoverShimmer = pow(hoverShimmer, 4.0) * uHover * 0.12;
  reflection += uAccentColor * hoverShimmer;

  // ── Chromatic aberration (subtle) ──
  float ca = (uScrollVelocity * 0.03 + uHover * 0.015 + uSelected * 0.02);
  float rShift = snoise(vec2(uv.x + ca, uv.y + uTime * 0.1)) * 0.5 + 0.5;
  float bShift = snoise(vec2(uv.x - ca, uv.y - uTime * 0.1)) * 0.5 + 0.5;
  baseColor.r += rShift * 0.03 * (uHover + uScrollVelocity * 0.5);
  baseColor.b += bShift * 0.03 * (uHover + uScrollVelocity * 0.5);

  // ── Fresnel edge glow ──
  float fresnelStrength = 0.5 + uHover * 0.4 + uSelected * 0.5 + uActive * 0.3;
  vec3 fresnelColor = uAccentColor * vFresnel * fresnelStrength;
  fresnelColor += vec3(0.8, 0.9, 1.0) * vFresnel * 0.2;

  // ── Edge highlight (thin border) ──
  float edgeX = smoothstep(0.0, 0.035, uv.x) * (1.0 - smoothstep(0.965, 1.0, uv.x));
  float edgeY = smoothstep(0.0, 0.025, uv.y) * (1.0 - smoothstep(0.975, 1.0, uv.y));
  float edgeMask = 1.0 - edgeX * edgeY;
  vec3 edgeColor = uAccentColor * 0.6 + vec3(0.5, 0.6, 0.7);
  vec3 border = edgeColor * edgeMask * (0.4 + uHover * 0.4 + uActive * 0.3);

  // ── Glass surface grain ──
  float grain = snoise(uv * 180.0 + uTime * 10.0) * 0.025;

  // ── Subtle vignette ──
  vec2 vigUv = uv * 2.0 - 1.0;
  float vignette = 1.0 - dot(vigUv * 0.4, vigUv * 0.4);
  vignette = smoothstep(0.0, 1.0, vignette);

  // ── Assemble ──
  vec3 finalColor = baseColor + reflection + fresnelColor + border;
  finalColor += grain;
  finalColor *= (0.75 + vignette * 0.25);

  // ── Active brightness ──
  finalColor *= (1.0 + uActive * 0.18 + uSelected * 0.22);

  // ── Opacity ──
  float alpha = uOpacity * (0.55 + vFresnel * 0.25 + edgeMask * 0.15 + uActive * 0.1 + uSelected * 0.1);
  alpha = clamp(alpha, 0.0, 0.92);

  gl_FragColor = vec4(finalColor, alpha);
}
