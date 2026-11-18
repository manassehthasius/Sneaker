"use client";

import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { EffectComposer, N8AO, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useStudio, type ViewPreset } from "@/lib/store";
import { Shoe } from "./Shoe";

const TARGET = new THREE.Vector3(0, 0.055, 0);
const VIEWS: Record<ViewPreset, [number, number, number]> = {
  threeQuarter: [0.3, 0.17, 0.4],
  side: [0, 0.07, 0.56],
  front: [0.52, 0.12, 0.04],
  back: [-0.52, 0.12, 0.04],
  top: [0.001, 0.6, 0.02],
  bottom: [0.02, -0.66, 0.16],
  explode: [0.42, 0.3, 0.62],
};

/** Bei schmalen (hohen) Ansichten weiter wegzoomen, damit der Schuh ganz sichtbar bleibt */
const fitFactor = (aspect: number) => Math.max(1, 1.2 / aspect);
const scaled = (p: [number, number, number], f: number) => new THREE.Vector3(...p).sub(TARGET).multiplyScalar(f).add(TARGET);

function CameraRig() {
  const view = useStudio((s) => s.view);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const anim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; t: number } | null>(null);
  const aspect = size.width / Math.max(1, size.height);

  // Abstand an das Seitenverhältnis anpassen (z. B. iPad im Hochformat)
  useEffect(() => {
    const dir = camera.position.clone().sub(TARGET);
    const base = new THREE.Vector3(...VIEWS.threeQuarter).sub(TARGET).length();
    camera.position.copy(TARGET).add(dir.normalize().multiplyScalar(base * fitFactor(aspect)));
    camera.lookAt(TARGET);
    if (controls) { controls.target.copy(TARGET); controls.update(); }
  }, [aspect, camera, controls]);

  useEffect(() => {
    if (view.nonce === 0) return;
    anim.current = { from: camera.position.clone(), to: scaled(VIEWS[view.preset], fitFactor(aspect)), t: 0 };
    let raf = 0;
    const step = () => {
      const a = anim.current;
      if (!a) return;
      a.t = Math.min(1, a.t + 0.045);
      const e = 1 - Math.pow(1 - a.t, 3);
      camera.position.lerpVectors(a.from, a.to, e);
      camera.lookAt(TARGET);
      if (controls) {
        controls.target.copy(TARGET);
        controls.update();
      }
      if (a.t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, camera, controls]);
  return null;
}

function Effects() {
  const quality = useStudio((s) => s.quality);
  // Auf Retina-Bildschirmen (z. B. iPad) die Schatten mit halber Auflösung rechnen: kaum sichtbar, deutlich flüssiger
  const dpr = useThree((s) => s.viewport.dpr);
  if (quality === "fast") return null;
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO aoRadius={0.018} distanceFalloff={0.6} intensity={2.4} quality={dpr > 1.5 ? "medium" : "high"} halfRes={dpr > 1.5} depthAwareUpsampling color="#1a1612" />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}

const SCENE_FILES = { studio: "/env/studio.hdr", street: "/env/street.hdr", parking: "/env/parking.hdr", city: "/env/city.hdr" } as const;

/** Lichtumgebung und Hintergrund: Studio neutral grau, Mockup-Szenen mit unscharfem Fotohintergrund */
function SceneSetup() {
  const scene = useStudio((s) => s.scene);
  if (scene === "studio") {
    return (
      <>
        {/* Neutral grau: nur so lassen sich Farben ehrlich beurteilen */}
        <color attach="background" args={["#979797"]} />
        <Suspense fallback={null}>
          <Environment files={SCENE_FILES.studio} environmentIntensity={1.0} />
        </Suspense>
      </>
    );
  }
  return (
    <Suspense fallback={<color attach="background" args={["#979797"]} />}>
      <Environment key={scene} files={SCENE_FILES[scene]} background backgroundBlurriness={0.16} backgroundIntensity={0.9} environmentIntensity={1.15} />
    </Suspense>
  );
}

function Controls() {
  const autoRotate = useStudio((s) => s.autoRotate);
  return <OrbitControls makeDefault target={TARGET} minDistance={0.14} maxDistance={1.1} enableDamping dampingFactor={0.08} autoRotate={autoRotate} autoRotateSpeed={1.6} />;
}

export default function Viewport() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: VIEWS.threeQuarter, fov: 30, near: 0.01, far: 10 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
      style={{ touchAction: "none" }}
    >
      <SceneSetup />
      <Suspense fallback={null}>
        <Shoe />
        <ContactShadows position={[0, 0.0004, 0]} opacity={0.6} scale={0.8} blur={3.2} far={0.12} resolution={1024} color="#1a1816" frames={Infinity} />
        <Effects />
      </Suspense>
      <directionalLight
        position={[0.25, 0.9, 0.35]}
        intensity={0.75}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.002}
        shadow-camera-left={-0.3}
        shadow-camera-right={0.3}
        shadow-camera-top={0.3}
        shadow-camera-bottom={-0.3}
        shadow-camera-near={0.1}
        shadow-camera-far={2}
      />
      {/* Streiflicht von hinten: lässt Wildleder-Flor und Kanten aufleuchten */}
      <directionalLight position={[-0.5, 0.35, -0.4]} intensity={0.35} color="#fff4e6" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0002, 0]} receiveShadow>
        <planeGeometry args={[2, 2]} />
        <shadowMaterial opacity={0.22} />
      </mesh>
      <Controls />
      <CameraRig />
    </Canvas>
  );
}
