"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { createGalaxyGeometry } from "./galaxy-geometry";
import { createGalaxyMaterial, hexToVector } from "./galaxy-material";
import { PLANETS, type Planet } from "./planets";
import { DEFAULT_SETTINGS } from "./settings";

const DESKTOP_PARTICLES = 64_000;
const MOBILE_PARTICLES = 24_000;
const OVERVIEW_POSITION = new THREE.Vector3(0, 9, 16);
const ORIGIN = new THREE.Vector3(0, 0, 0);
// Frames to wait before reporting ready, so shaders and the bloom buffers are warm.
const READY_AFTER_FRAMES = 3;
// Where a planet's DOM label sits relative to the planet, in world units.
const LABEL_OFFSET = new THREE.Vector3(0, 0.7, 0);

type Viewpoint = { look: THREE.Vector3; position: THREE.Vector3 };
export type PlaceLabel = (id: string, x: number, y: number, visible: boolean) => void;

// Camera spot for each planet: a little outward from the galaxy and above the disc.
const VIEWPOINTS: Record<string, Viewpoint> = Object.fromEntries(
  PLANETS.map((planet) => {
    const look = new THREE.Vector3(...planet.position);
    const outward = look.clone().setY(0).normalize().multiplyScalar(5.5);
    const position = look.clone().add(outward).add(new THREE.Vector3(0, 2.2, 0));
    return [planet.id, { look, position }];
  }),
);

function isMobile() {
  return window.matchMedia("(max-width: 720px), (pointer: coarse)").matches;
}

export type GalaxySceneProps = {
  arms: number;
  spin: boolean;
  speed: number;
  core: string;
  mid: string;
  edge: string;
  focusId: string | null;
  placeLabel: PlaceLabel;
  onSelect: (id: string) => void;
  onReady: () => void;
};

export default function GalaxyScene(props: GalaxySceneProps) {
  const [count] = useState(() => (isMobile() ? MOBILE_PARTICLES : DESKTOP_PARTICLES));

  return (
    <Canvas
      camera={{ position: [0, 22, 40], fov: 45, near: 0.1, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.domElement.setAttribute("data-testid", "galaxy-canvas")}
    >
      <color attach="background" args={["#03020a"]} />
      <Stars radius={90} depth={60} count={2500} factor={3.5} saturation={0} fade speed={0.4} />
      <Particles
        arms={props.arms}
        count={count}
        spin={props.spin}
        speed={props.speed}
        core={props.core}
        mid={props.mid}
        edge={props.edge}
      />
      {PLANETS.map((planet) => (
        <PlanetMarker key={planet.id} planet={planet} onSelect={props.onSelect} />
      ))}
      <CameraRig focusId={props.focusId} />
      <PlanetLabels placeLabel={props.placeLabel} />
      <FrameReady onReady={props.onReady} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.55} luminanceThreshold={0.3} luminanceSmoothing={0.25} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}

type ParticlesProps = {
  arms: number;
  count: number;
  spin: boolean;
  speed: number;
  core: string;
  mid: string;
  edge: string;
};

function Particles({ arms, count, spin, speed, core, mid, edge }: ParticlesProps) {
  const geometry = useMemo(() => createGalaxyGeometry(arms, count), [arms, count]);
  // Created once; the colour effect below keeps its uniforms in sync with the props.
  const material = useMemo(() => createGalaxyMaterial(DEFAULT_SETTINGS), []);
  const points = useRef<THREE.Points>(null);
  const motion = useRef({ rot: 0, amount: 1 });

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    material.uniforms.uCore.value.copy(hexToVector(core));
    material.uniforms.uMid.value.copy(hexToVector(mid));
    material.uniforms.uEdge.value.copy(hexToVector(edge));
  }, [material, core, mid, edge]);

  useFrame((state, dt) => {
    if (!points.current) return;
    // Ease the spin in and out so toggling it never snaps the galaxy.
    motion.current.amount += ((spin ? 1 : 0) - motion.current.amount) * (1 - Math.exp(-dt * 3));
    motion.current.rot += dt * speed * motion.current.amount;

    const shader = points.current.material as THREE.ShaderMaterial;
    shader.uniforms.uRot.value = motion.current.rot;
    shader.uniforms.uTime.value = state.clock.elapsedTime;
    shader.uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />;
}

function PlanetMarker({ planet, onSelect }: { planet: Planet; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState(false);
  const glow = useMemo(() => new THREE.Color(planet.color).multiplyScalar(1.8), [planet.color]);

  return (
    <group position={planet.position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(planet.id);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshBasicMaterial color={glow} toneMapped={false} />
      </mesh>
      <mesh scale={hovered ? 2.2 : 1.8}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshBasicMaterial
          color={glow}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// Projects each planet to the screen and hands the position to the overlay, which owns the
// DOM labels (plain buttons, so they stay keyboard-accessible and testable).
function PlanetLabels({ placeLabel }: { placeLabel: PlaceLabel }) {
  const projected = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    for (const planet of PLANETS) {
      projected.current.set(...planet.position).add(LABEL_OFFSET).project(camera);
      const visible = projected.current.z <= 1;
      const x = ((projected.current.x + 1) / 2) * size.width;
      const y = ((1 - projected.current.y) / 2) * size.height;
      placeLabel(planet.id, x, y, visible);
    }
  });

  return null;
}

function CameraRig({ focusId }: { focusId: string | null }) {
  const look = useRef(new THREE.Vector3());
  const goal = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const ease = 1 - Math.exp(-dt * 2);
    const view = focusId ? VIEWPOINTS[focusId] : null;
    // Parallax fades out while a planet is in focus so the framing stays put.
    const drift = view ? 0.25 : 1;

    // Narrow (portrait) screens pull the overview back so more of the disc fits.
    const zoom = view ? 1 : Math.max(1, 1.5 / (state.size.width / state.size.height));
    goal.current.copy(view ? view.position : OVERVIEW_POSITION).multiplyScalar(zoom);
    goal.current.x += state.pointer.x * 1.8 * drift;
    goal.current.y += state.pointer.y * 0.9 * drift;
    state.camera.position.lerp(goal.current, ease);

    look.current.lerp(view ? view.look : ORIGIN, ease);
    state.camera.lookAt(look.current);
  });

  return null;
}

function FrameReady({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);

  useFrame(() => {
    frames.current += 1;
    if (frames.current === READY_AFTER_FRAMES) onReady();
  });

  return null;
}
