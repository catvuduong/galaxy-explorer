import * as THREE from "three";
import { GALAXY_RADIUS } from "./galaxy-geometry";

const vertexShader = /* glsl */ `
  attribute vec4 aPolar;

  uniform float uRot;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec3 uCore;
  uniform vec3 uMid;
  uniform vec3 uEdge;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float n = clamp(aPolar.x / ${GALAXY_RADIUS.toFixed(1)}, 0.0, 1.0);

    // Differential rotation: the inner disc turns faster than the outer edge.
    float angle = aPolar.y + uRot * (0.22 / (0.25 + n));
    vec3 pos = vec3(cos(angle) * aPolar.x, aPolar.z, sin(angle) * aPolar.x);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float seed = aPolar.w;
    float twinkle = 0.8 + 0.2 * sin(uTime * (0.8 + seed * 2.0) + seed * 60.0);
    // Capped so particles passing close to the camera don't balloon into blobs.
    gl_PointSize = min((0.6 + seed * 1.2) * uPixelRatio * twinkle * (60.0 / -mv.z), 22.0 * uPixelRatio);
    gl_Position = projectionMatrix * mv;

    float t = clamp(n * 0.95 + (seed - 0.5) * 0.15, 0.0, 1.0);
    vec3 color = t < 0.4
      ? mix(uCore, uMid, t / 0.4)
      : mix(uMid, uEdge, (t - 0.4) / 0.6);

    vColor = color;
    vAlpha = mix(0.8, 0.45, n);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float falloff = pow(1.0 - d * 2.0, 2.0);
    // Additive blending: output colour only, the sprite fades to nothing at its edge.
    gl_FragColor = vec4(vColor * falloff * vAlpha, 1.0);
  }
`;

// Hex colours are passed as raw sRGB values: the shader writes them out untouched.
export function hexToVector(hex: string) {
  const value = parseInt(hex.replace("#", ""), 16);
  return new THREE.Vector3((value >> 16) & 255, (value >> 8) & 255, value & 255).divideScalar(255);
}

export function createGalaxyMaterial(colors: { core: string; mid: string; edge: string }) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uRot: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uCore: { value: hexToVector(colors.core) },
      uMid: { value: hexToVector(colors.mid) },
      uEdge: { value: hexToVector(colors.edge) },
    },
  });
}
