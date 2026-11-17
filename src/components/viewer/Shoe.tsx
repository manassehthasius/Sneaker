"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildShoe, EXPLODE } from "@/lib/shoe/geometry";
import { createMaterial, setMaterialColor, threadColor } from "@/lib/shoe/materials";
import type { MaterialId, PartId } from "@/lib/shoe/types";
import { useStudio } from "@/lib/store";

/** Welche Teile in welchem Bauschritt schon vorhanden sind */
export const BAU_STEPS: { title: string; parts: PartId[] }[] = [
  { title: "Leisten", parts: ["lining"] },
  { title: "Zuschnitt der Grundteile", parts: ["lining", "quarter", "vamp"] },
  { title: "Overlays aufnähen", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay"] },
  { title: "Details anbringen", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "heeltab", "badge"] },
  { title: "Futter und Zunge", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "heeltab", "badge", "tongue"] },
  { title: "Zwicken", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "heeltab", "badge", "tongue"] },
  { title: "Sohle anbringen", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "heeltab", "badge", "tongue", "midsole", "outsole"] },
  { title: "Schnüren und Finish", parts: ["lining", "quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "heeltab", "badge", "tongue", "midsole", "outsole", "laces"] },
];

const HIGHLIGHT = new THREE.Color("#efe3c8");
const PART_IDS: PartId[] = ["quarter", "vamp", "toecap", "mudguard", "heel", "heeltab", "eyestay", "tongue", "lining", "badge", "laces", "midsole", "outsole"];

interface PartMats {
  key: MaterialId;
  surface: THREE.MeshPhysicalMaterial;
  thread: THREE.MeshStandardMaterial;
}

export function Shoe() {
  const design = useStudio((s) => s.design);
  const selected = useStudio((s) => s.selected);
  const select = useStudio((s) => s.select);
  const bauStep = useStudio((s) => s.bauStep);
  const explode = useStudio((s) => s.explode);

  const geo = useMemo(() => buildShoe(design.soleH), [design.soleH]);
  useEffect(() => () => geo.parts.forEach((p) => [p.surface, p.stitches, p.eyelets, p.dark].forEach((g) => g?.dispose())), [geo]);

  // Materialien pro Teil. Neu angelegt wird nur, wenn sich ein Material ändert; Farben werden direkt aktualisiert.
  const matKey = PART_IDS.map((id) => design.parts[id].m).join(",");
  const mats = useMemo(() => {
    const map = new Map<PartId, PartMats>();
    const keys = matKey.split(",") as MaterialId[];
    PART_IDS.forEach((id, i) => {
      map.set(id, { key: keys[i], surface: createMaterial(keys[i], "#ffffff"), thread: new THREE.MeshStandardMaterial({ roughness: 0.85 }) });
    });
    return map;
  }, [matKey]);
  useEffect(() => () => mats.forEach((pm) => { pm.surface.dispose(); pm.thread.dispose(); }), [mats]);
  useLayoutEffect(() => {
    mats.forEach((pm, id) => {
      const style = design.parts[id];
      setMaterialColor(pm.surface, pm.key, style.c);
      pm.thread.color.set(threadColor(style.c));
    });
  }, [design, mats]);

  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c9c4b8", metalness: 1, roughness: 0.32 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#0d0c0b", roughness: 1 }), []);

  // Auswahl sanft pulsieren lassen
  useFrame(({ clock }) => {
    const pulse = 0.06 + 0.05 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 3));
    mats.forEach((pm, id) => {
      if (id === selected && bauStep === null) {
        pm.surface.emissive.copy(HIGHLIGHT);
        pm.surface.emissiveIntensity = pulse;
      } else {
        pm.surface.emissiveIntensity = 0;
      }
    });
  });

  // Auseinanderfliegen weich animieren
  const groups = useRef(new Map<PartId, THREE.Group>());
  const current = useRef(0);
  useFrame((_, dt) => {
    current.current = THREE.MathUtils.damp(current.current, explode, 6, dt);
    groups.current.forEach((g, id) => {
      const [x, y, z] = EXPLODE[id];
      g.position.set(x * current.current, y * current.current, z * current.current);
    });
  });

  const visible = bauStep === null ? null : new Set(BAU_STEPS[bauStep].parts);

  const onClick = (id: PartId) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(id);
  };

  return (
    <group scale={0.001} position={[0, geo.groundOffset * 0.001, 0]}>
      {geo.parts.map((p) => {
        const pm = mats.get(p.part)!;
        return (
          <group
            key={p.part}
            visible={!visible || visible.has(p.part)}
            ref={(g) => {
              if (g) groups.current.set(p.part, g);
              else groups.current.delete(p.part);
            }}
          >
            <mesh
              geometry={p.surface}
              material={pm.surface}
              castShadow
              receiveShadow
              onClick={onClick(p.part)}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => (document.body.style.cursor = "")}
            />
            {p.stitches && <mesh geometry={p.stitches} material={pm.thread} raycast={() => null} />}
            {p.eyelets && <mesh geometry={p.eyelets} material={metal} raycast={() => null} />}
            {p.dark && <mesh geometry={p.dark} material={dark} raycast={() => null} />}
          </group>
        );
      })}
    </group>
  );
}
