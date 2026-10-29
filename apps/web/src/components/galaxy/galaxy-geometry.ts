import * as THREE from "three";

// Shared with the vertex shader: particles never leave a disc of this radius.
export const GALAXY_RADIUS = 10;

const BULGE_SHARE = 0.12;
const BULGE_RADIUS = 2.2;
const SPIRAL_TIGHTNESS = 0.55;

// Seeded so the galaxy looks the same on every load (and in screenshots).
function mulberry32(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/**
 * Builds the particle cloud. Each particle stores its polar coordinates in
 * `aPolar` (radius, base angle, height, seed); the shader turns those into
 * positions every frame so the disc can spin without rewriting the buffer.
 */
export function createGalaxyGeometry(arms: number, count: number) {
  const rand = mulberry32(1337);
  const position = new Float32Array(count * 3);
  const polar = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const seed = rand();
    let radius: number;
    let angle: number;
    let height: number;

    if (rand() < BULGE_SHARE) {
      // Spherical core bulge, no arm structure.
      radius = Math.pow(rand(), 1.2) * BULGE_RADIUS;
      angle = rand() * Math.PI * 2;
      height = gaussian(rand) * 0.35 * (1 - radius / BULGE_RADIUS);
    } else {
      // Denser towards the centre; arms are interleaved by index.
      const n = Math.pow(rand(), 1.7);
      radius = n * GALAXY_RADIUS;
      const armBase = ((i % arms) / arms) * Math.PI * 2;
      const twist = radius * SPIRAL_TIGHTNESS;
      angle = armBase + twist + gaussian(rand) * (0.12 + 0.2 * n);
      radius = Math.max(0, radius + gaussian(rand) * (0.15 + 0.35 * n));
      height = gaussian(rand) * 0.12 * (1.2 - n);
    }

    polar[i * 4] = radius;
    polar[i * 4 + 1] = angle;
    polar[i * 4 + 2] = height;
    polar[i * 4 + 3] = seed;

    position[i * 3] = Math.cos(angle) * radius;
    position[i * 3 + 1] = height;
    position[i * 3 + 2] = Math.sin(angle) * radius;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aPolar", new THREE.BufferAttribute(polar, 4));
  return geometry;
}
