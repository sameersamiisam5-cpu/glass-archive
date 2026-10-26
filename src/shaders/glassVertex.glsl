uniform float uTime;
uniform float uScroll;
uniform float uScrollVelocity;
uniform float uHover;
uniform float uSelected;
uniform vec2 uMouse;
uniform vec2 uResolution;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec3 vViewDir;
varying float vFresnel;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);

  // Subtle vertex distortion on hover / scroll velocity
  vec3 pos = position;

  float velocityWave = sin(pos.x * 2.0 + uTime * 1.5) * 0.012 * uScrollVelocity;
  float hoverWave = sin(pos.x * 3.0 + pos.y * 2.0 + uTime * 2.0) * 0.008 * uHover;
  float selectedWave = sin(pos.x * 1.5 + pos.y * 1.5 + uTime * 3.0) * 0.005 * uSelected;

  pos.z += velocityWave + hoverWave + selectedWave;

  vec4 worldPos4 = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos4.xyz;

  vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
  vViewDir = normalize(-mvPos.xyz);

  // Fresnel
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
  vec3 camDir = normalize(cameraPosition - vWorldPos);
  vFresnel = pow(1.0 - abs(dot(worldNormal, camDir)), 3.0);

  gl_Position = projectionMatrix * mvPos;
}
