/**
 * Physikalisch basierte Materialien aus den CC0-Scans (siehe public/materials/CREDITS.md).
 * Die Farbtexturen sind in Graustufen aufbereitet, damit jede Farbe sauber einfärbbar ist.
 */
import * as THREE from "three";
import type { MaterialId } from "./types";

interface MaterialRecipe {
  /** Grösse einer Texturkachel in mm */
  tile: number;
  roughness: number;
  normalScale: number;
  maps: { albedo?: boolean; normal?: boolean; roughness?: boolean; alpha?: boolean };
  sheen?: number;
  sheenRoughness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  /** Ordner unter /materials, falls abweichend */
  dir?: string;
}

const RECIPES: Record<MaterialId, MaterialRecipe> = {
  leather: { tile: 140, roughness: 0.5, normalScale: 0.55, maps: { albedo: true, normal: true, roughness: true }, clearcoat: 0.12, clearcoatRoughness: 0.45 },
  suede: { tile: 110, roughness: 1, normalScale: 0.35, maps: { albedo: true, normal: true }, sheen: 1, sheenRoughness: 0.55 },
  nubuck: { tile: 120, roughness: 0.92, normalScale: 0.3, maps: { albedo: true, normal: true }, sheen: 0.55, sheenRoughness: 0.45 },
  canvas: { tile: 55, roughness: 0.95, normalScale: 0.9, maps: { albedo: true, normal: true, roughness: true } },
  mesh: { tile: 45, roughness: 0.85, normalScale: 0.8, maps: { albedo: true, normal: true, alpha: true } },
  knit: { tile: 60, roughness: 0.92, normalScale: 0.9, maps: { albedo: true, normal: true, roughness: true } },
  ripstop: { tile: 50, roughness: 0.62, normalScale: 0.6, maps: { albedo: true, normal: true }, sheen: 0.25, sheenRoughness: 0.3 },
  cotton: { tile: 18, roughness: 0.95, normalScale: 0.8, maps: { albedo: true, normal: true } },
  rubber: { tile: 90, roughness: 0.78, normalScale: 0.35, maps: { normal: true, roughness: true } },
  eva: { tile: 70, roughness: 0.68, normalScale: 0.4, maps: { albedo: true, normal: true } },
};

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

function tex(mat: MaterialId, kind: string, srgb: boolean, tile: number, aniso: number) {
  const key = `${mat}/${kind}`;
  let t = cache.get(key);
  if (!t) {
    t = loader.load(`/materials/${mat}/${kind}.jpg`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.repeat.set(100 / tile, 100 / tile);
    t.anisotropy = aniso;
    cache.set(key, t);
  }
  return t;
}

/** Ausgleich: die Graustufen-Texturen haben im Mittel ~80 % Helligkeit (sRGB). */
const ALBEDO_COMPENSATION = 1 / Math.pow(0.8, 2.2);

export function createMaterial(mat: MaterialId, hex: string, aniso = 8): THREE.MeshPhysicalMaterial {
  const r = RECIPES[mat];
  const m = new THREE.MeshPhysicalMaterial({
    roughness: r.roughness,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  if (r.maps.albedo) m.map = tex(mat, "albedo", true, r.tile, aniso);
  if (r.maps.normal) {
    m.normalMap = tex(mat, "normal", false, r.tile, aniso);
    m.normalScale.set(r.normalScale, r.normalScale);
  }
  if (r.maps.roughness) m.roughnessMap = tex(mat, "roughness", false, r.tile, aniso);
  if (r.maps.alpha) {
    m.alphaMap = tex(mat, "alpha", false, r.tile, aniso);
    m.alphaTest = 0.5;
  }
  if (r.sheen) {
    m.sheen = r.sheen;
    m.sheenRoughness = r.sheenRoughness ?? 0.5;
  }
  if (r.clearcoat) {
    m.clearcoat = r.clearcoat;
    m.clearcoatRoughness = r.clearcoatRoughness ?? 0.4;
  }
  setMaterialColor(m, mat, hex);
  return m;
}

export function setMaterialColor(m: THREE.MeshPhysicalMaterial, mat: MaterialId, hex: string) {
  const r = RECIPES[mat];
  m.color.set(hex);
  if (r.maps.albedo) m.color.multiplyScalar(ALBEDO_COMPENSATION);
  if (r.sheen) {
    // Wildleder: der Flor hellt die Farbe im Streiflicht auf
    m.sheenColor.set(hex).lerp(new THREE.Color("#ffffff"), 0.35);
  }
}

/** Garnfarbe: Ton in Ton, etwas dunkler als das Teil */
export function threadColor(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * 0.9, hsl.l > 0.5 ? hsl.l - 0.12 : hsl.l + 0.1);
  return "#" + c.getHexString();
}

/** Laufsohlen-Unterseite: Gummi mit Fischgrat-Profil */
export function createTreadMaterial(hex: string, aniso = 8): THREE.MeshPhysicalMaterial {
  const m = createMaterial("rubber", hex, aniso);
  const n = loader.load("/materials/tread/normal.jpg");
  n.wrapS = n.wrapT = THREE.RepeatWrapping;
  n.colorSpace = THREE.NoColorSpace;
  n.repeat.set(100 / 34, 100 / 34);
  n.anisotropy = aniso;
  m.normalMap = n;
  m.normalScale.set(1.4, 1.4);
  m.roughness = 0.85;
  return m;
}

/** Text für den Logo-Patch als Textur (weisser Text auf transparentem Grund, wird eingefärbt) */
export function createLabelTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 236;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, c.width, c.height);
  const label = (text || "").toUpperCase().slice(0, 12);
  let size = 130;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const font = (px: number) => `900 ${px}px "Archivo", "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(label).width > c.width * 0.78 && size > 30) {
    size -= 4;
    ctx.font = font(size);
  }
  ctx.fillText(label, c.width / 2, c.height / 2 + size * 0.04);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Kontrastfarbe für Prägung/Druck auf dem Patch */
export function labelColor(hex: string) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * 0.6, hsl.l > 0.55 ? Math.max(0.12, hsl.l - 0.5) : Math.min(0.94, hsl.l + 0.55));
  return c;
}

export function applyLabel(m: THREE.MeshStandardMaterial, tex: THREE.Texture, badgeHex: string) {
  m.map = tex;
  m.color.copy(labelColor(badgeHex));
  m.needsUpdate = true;
}
