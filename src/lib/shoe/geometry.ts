/**
 * Parametrisches 3D-Modell eines Low-Top-Sneakers.
 *
 * Grundidee wie in der echten Schuhentwicklung: Zuerst wird ein Leisten (Fussform)
 * als Fläche beschrieben. Jedes Teil des Schafts ist ein Ausschnitt dieser Fläche,
 * leicht nach aussen versetzt (Overlays liegen über den Grundteilen) und mit
 * sichtbarer Materialdicke. Die Sohle ist eine Cupsole, die den Schaft unten umschliesst.
 *
 * Interne Koordinaten in Millimetern: X = Länge (Ferse 0 → Spitze L),
 * Y = seitlich (+ aussen/lateral), Z = oben. Ausgabe für three.js: x = X - L/2, y = Z, z = Y.
 *
 * Parameter der Fläche: t ∈ [0,1] entlang der Länge, s ∈ [-1,1] rund um den Fuss
 * (−1 innen unten, 0 oben Mitte, +1 aussen unten). v ∈ [0,1] ist s relativ zur Öffnung:
 * v = 0 an der Kante des Einstiegs bzw. der Schnürung, v = 1 unten an der Sohle.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PartId } from "./types";

export const L = 290; // Schuhlänge in mm (ca. EU 42)
/** Wie hoch die Sohle den Schaft umschliesst (mm), je nach Sohlentyp und Position */
function rimFor(shape: ShapeParams) {
  const base = rimBase(shape);
  const shell = shape.shellToe ?? 0;
  if (shell <= 0.01) return base;
  // Shell Toe: die Sohle zieht sich als Gummikappe über die Spitze
  return (t: number) => base(t) + shell * 26 * Math.pow(smooth(0.74, 0.97, t), 0.8);
}
function rimBase(shape: ShapeParams) {
  switch (shape.soleType) {
    case "vulc":
      return (t: number) => 9 + 13 * smooth(0.8, 0.97, t); // Gummikappe vorne
    case "runner":
      return (t: number) => 9 + 3 * (1 - smooth(0.05, 0.3, t));
    case "chunky":
      return () => 13;
    case "lug":
      return () => 15;
    default:
      return () => 11;
  }
}

/* ------------------------------------------------------------------ */
/* Hilfsfunktionen                                                     */
/* ------------------------------------------------------------------ */

/** Monotone kubische Interpolation (Fritsch-Carlson) durch Stützpunkte. */
function spline(knots: [number, number][]) {
  const n = knots.length;
  const xs = knots.map((k) => k[0]);
  const ys = knots.map((k) => k[1]);
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const u = (x - xs[i]) / h;
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const smooth = (a: number, b: number, x: number) => {
  const u = clamp((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};

/* ------------------------------------------------------------------ */
/* Leisten                                                             */
/* ------------------------------------------------------------------ */

/** Halbe Breite des Fussabdrucks (ohne Abrundung an Ferse und Spitze). */
const halfWidthBase = spline([[0, 33], [0.2, 34], [0.35, 35], [0.5, 38], [0.65, 45], [0.74, 47], [0.86, 43], [1, 35]]);
/** Höhe des Leistens über der Sohle in der Mitte (Rist). */
const heightBase = spline([[0, 72], [0.06, 80], [0.15, 88], [0.25, 92], [0.35, 86], [0.45, 74], [0.55, 60], [0.65, 47], [0.75, 38], [0.85, 30], [0.93, 23], [1, 13]]);
/** «Eckigkeit» des Querschnitts (2 = Ellipse, höher = kantiger). */
const squareness = spline([[0, 2.2], [0.2, 2.4], [0.5, 2.45], [0.75, 2.2], [1, 2.0]]);
/** Oberkante des Kragens (Topline) im Fersenbereich: Low-Top und High-Top */
const toplineLow = spline([[0, 70], [0.05, 68], [0.12, 58], [0.18, 51], [0.24, 55], [0.29, 70], [0.34, 92], [0.4, 140]]);
const toplineHigh = spline([[0, 128], [0.06, 126], [0.12, 121], [0.17, 124], [0.22, 140], [0.3, 190]]);

export type SoleType = "cupsole" | "vulc" | "chunky" | "runner" | "lug";

/** Form-Parameter eines Modells. Alle Regler im Studio ändern diese Werte. */
export interface ShapeParams {
  /** Zehenhub in mm: wie stark die Spitze nach oben gebogen ist */
  toeSpring: number;
  /** Schafthöhe: 0 = Low, 0.5 = Mid, 1 = High */
  collar: number;
  /** Breite der Spitze (0.85 schmal … 1.15 breit) */
  toeWidth: number;
  /** Höhe der Zehenbox (0.8 flach … 1.25 hoch) */
  toeHeight: number;
  /** Form der Spitze (0 spitz … 1 rund) */
  toeRound: number;
  /** Gesamtbreite (0.92 … 1.08) */
  width: number;
  /** Sohlentyp */
  soleType: SoleType;
  /** Wie weit die Sohle seitlich übersteht (mm) */
  soleFlare: number;

  /* ---- Konstruktion (Schnitt) ---- */
  /** Zehenkappe: klassische Kappe, T-Toe (Kappe plus Streifen bis zur Schnürung) oder keine */
  toecapStyle: "cap" | "ttoe" | "none";
  /** Länge der Zehenkappe (0 kurz … 1 lang) */
  toecapLength: number;
  /** Höhe des Seitenbands (0 = keins … 1 = sehr hoch, «Ollie-Guard») */
  mudguardHeight: number;
  /** Grösse der Fersenkappe (0 = keine … 1.4 = gross) */
  heelCounter: number;
  /** Breite der Ösenleiste (0.08 … 0.24) */
  eyestayWidth: number;
  /** Anzahl Ösen pro Seite (0 = automatisch) */
  eyelets: number;
  /** Zusätzliche Höhe der Zunge in mm (gepolsterte «Puffy Tongue») */
  tongueHeight: number;
  /** Tiefe des Kragenausschnitts am Knöchel (0.3 flach … 1.8 tief) */
  collarDip: number;
  /** Gummi-Kappe über der Spitze aus Sohlenmaterial (0 … 1), «Shell Toe» */
  shellToe: number;
  /** Breite der Schnürsenkel in mm */
  laceWidth: number;
  /** Geteilte Zunge («Split Tongue») */
  tongueSplit: boolean;
}

export const DEFAULT_SHAPE: ShapeParams = {
  toeSpring: 11, collar: 0, toeWidth: 1, toeHeight: 1, toeRound: 0.5, width: 1, soleType: "cupsole", soleFlare: 0,
  toecapStyle: "cap", toecapLength: 0.5, mudguardHeight: 0.4, heelCounter: 1, eyestayWidth: 0.15, eyelets: 0, tongueHeight: 0, collarDip: 1, shellToe: 0, laceWidth: 7, tongueSplit: false,
};

/** Aktive Form während eines Aufbaus (buildShoe läuft synchron). */
let S: ShapeParams = DEFAULT_SHAPE;

export function halfWidth(t: number): number {
  let cap = 1;
  if (t < 0.12) cap = Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / 0.12, 2)));
  else if (t > 0.78) {
    const p = lerp(1.5, 3.4, S.toeRound);
    cap = Math.pow(Math.max(0, 1 - Math.pow((t - 0.78) / 0.22, p)), lerp(0.62, 0.5, S.toeRound));
  }
  return halfWidthBase(t) * cap * S.width * lerp(1, S.toeWidth, smooth(0.5, 0.82, t));
}

function height(t: number): number {
  const ankle = 54 * S.collar * (1 - smooth(0.14, 0.42, t));
  return heightBase(t) * lerp(1, S.toeHeight, smooth(0.55, 0.82, t)) + ankle;
}

function topline(t: number): number {
  const dip = (S.collarDip - 1) * 11 * Math.exp(-Math.pow((t - 0.17) / 0.065, 2));
  return lerp(toplineLow(t) - dip, toplineHigh(t) - dip * 0.5, S.collar);
}

/** Wo die Schnürung beginnt (bei High-Tops weiter oben am Knöchel) */
const throatStart = () => lerp(0.28, 0.165, S.collar);

function spring(t: number, shape: ShapeParams) {
  return shape.toeSpring * Math.pow(smooth(0.68, 1, t), 2);
}

function superR(theta: number, n: number) {
  return 1 / Math.pow(Math.pow(Math.abs(Math.cos(theta)), n) + Math.pow(Math.abs(Math.sin(theta)), n), 1 / n);
}

/** Punkt auf dem Leisten (mm, interne Koordinaten). */
function lastPoint(t: number, s: number, shape: ShapeParams, out: THREE.Vector3) {
  const tt = clamp(t, 0, 1);
  const w = halfWidth(tt), h = height(tt), n = squareness(tt);
  const theta = s * (Math.PI / 2);
  const r = superR(theta, n);
  const y = w * r * Math.sin(theta);
  const z = h * r * Math.cos(theta);
  const zr = clamp(z / h);
  let x = tt * L;
  // Ferse: wölbt sich in der Mitte nach hinten, Kragen neigt sich leicht nach vorne
  const heelW = 1 - smooth(0, 0.22, tt);
  x += heelW * (-7 * Math.sin(Math.PI * zr * 0.9) + 6 * zr * zr);
  // Spitze: unten runder Zehenschutz, oben leicht zurückgenommen
  const toeW = smooth(0.82, 1, tt);
  x += toeW * (-14 * zr * zr + 2 * (1 - zr));
  return out.set(x, y, z + spring(tt, shape));
}

/** Kante der Einstiegsöffnung, als s-Wert pro t (Tabelle). */
function buildOpening(shape: ShapeParams) {
  const N = 400;
  const table = new Float32Array(N + 1);
  const p = new THREE.Vector3();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    // Kragen: s, bei dem die Höhe der Topline erreicht wird
    const T = topline(t) + spring(t, shape);
    let lo = 0, hi = 1;
    lastPoint(t, 0, shape, p);
    let sCollar = 0;
    if (p.z > T) {
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        lastPoint(t, mid, shape, p);
        if (p.z > T) lo = mid; else hi = mid;
      }
      sCollar = (lo + hi) / 2;
    }
    // Schnürung: schmale Öffnung zwischen den Ösenleisten
    let sThroat = 0;
    if (t > throatStart() && t < 0.625) {
      const front = 0.555;
      sThroat = t <= front ? 0.22 : 0.22 * Math.sqrt(Math.max(0, 1 - Math.pow((t - front) / 0.07, 2)));
    }
    table[i] = Math.max(sCollar, sThroat);
  }
  // Übergang Kragen → Schnürung glätten (sonst entstehen Knicke in den Teilen)
  for (let pass = 0; pass < 4; pass++) {
    const src = table.slice();
    const R = 6;
    for (let i = 0; i <= N; i++) {
      let sum = 0, cnt = 0;
      for (let k = -R; k <= R; k++) {
        const j = Math.min(N, Math.max(0, i + k));
        sum += src[j]; cnt++;
      }
      table[i] = sum / cnt;
    }
  }
  return (t: number) => {
    const x = clamp(t) * N;
    const i = Math.min(N - 1, Math.floor(x));
    return lerp(table[i], table[i + 1], x - i);
  };
}

/* ------------------------------------------------------------------ */
/* Flächen-Teile (Panels)                                              */
/* ------------------------------------------------------------------ */

type Side = 1 | -1;

interface PanelSpec {
  part: PartId;
  sides: Side[];
  /** Versatz der Aussenfläche über dem Leisten (mm) */
  layer: number;
  /** Tiefe der sichtbaren Kante (mm) */
  thick: number;
  /** "v": v-Bereich fest, t hängt von v ab. "t": t-Bereich fest, v hängt von t ab. "s": wie "t", aber direkt mit s statt v */
  mode: "v" | "t";
  a0: number;
  a1: number;
  lo: (x: number) => number;
  hi: (x: number) => number;
  segA: number;
  segB: number;
  /** Welche Kanten eine Naht bekommen */
  stitch?: ("lo" | "hi" | "a0" | "a1")[];
  /** Bekommt bei «Doppelnaht» eine zweite Nahtreihe */
  double?: boolean;
  /** Inneres Futter: Normale nach innen */
  inner?: boolean;
  noWalls?: boolean;
  /** Zusätzliche Anhebung nach oben (mm), z. B. für die Fersenlasche */
  extraZ?: (t: number, v: number) => number;
  /** Zweite Koordinate ist direkt |s| (nicht relativ zur Öffnung). Für Teile, die die Öffnung nicht berühren. */
  abs?: boolean;
  /** Zweite Koordinate wird auf eine feste Höhe in mm abgebildet (a0 → z0, a1 → z1), unabhängig von der Schafthöhe */
  zMap?: [number, number];
}

export interface PartGeometry {
  part: PartId;
  /** Hauptfläche */
  surface: THREE.BufferGeometry;
  /** Nähte (Garn) */
  stitches?: THREE.BufferGeometry;
  /** Metall-Ösen */
  eyelets?: THREE.BufferGeometry;
  /** Dunkle Löcher, Innenteile */
  dark?: THREE.BufferGeometry;
  /** Fläche für den Logo-Text (UV 0..1 über den Patch) */
  label?: THREE.BufferGeometry;
  /** Sohlenprofil an der Unterseite */
  tread?: THREE.BufferGeometry;
  /** Kunststoff-Enden der Schnürsenkel */
  aglets?: THREE.BufferGeometry;
}

export interface BuildOptions {
  doubleStitch?: boolean;
  perforation?: boolean;
}

export interface ShoeGeometry {
  parts: PartGeometry[];
  /** Abstand von der Sohlenunterseite (tiefster Punkt) bis z=0 in mm */
  groundOffset: number;
}

class Builder {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  idx: number[] = [];
  vertex(p: THREE.Vector3, n: THREE.Vector3 | null, u: number, v: number) {
    // interne Koordinaten -> three.js
    this.pos.push(p.x - L / 2, p.z, p.y);
    if (n) this.nor.push(n.x, n.z, n.y);
    this.uv.push(u, v);
    return this.pos.length / 3 - 1;
  }
  tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }
  build(withNormals: boolean) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.idx);
    if (withNormals && this.nor.length === this.pos.length) g.setAttribute("normal", new THREE.Float32BufferAttribute(this.nor, 3));
    else g.computeVertexNormals();
    return g;
  }
}

/** Dreht die Dreiecke so, dass ihre Richtung zu den Normalen passt. */
function orientToNormals(g: THREE.BufferGeometry) {
  const idx = g.getIndex();
  const pos = g.getAttribute("position");
  const nor = g.getAttribute("normal");
  if (!idx || !nor) return;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  let score = 0;
  for (let i = 0; i < idx.count; i += 3) {
    const ia = idx.getX(i), ib = idx.getX(i + 1), ic = idx.getX(i + 2);
    a.fromBufferAttribute(pos, ia); b.fromBufferAttribute(pos, ib); c.fromBufferAttribute(pos, ic);
    const f = b.sub(a).cross(c.sub(a));
    n.fromBufferAttribute(nor, ia);
    score += Math.sign(f.dot(n));
  }
  if (score < 0) {
    const arr = idx.array as Uint32Array | Uint16Array;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = t;
    }
    idx.needsUpdate = true;
  }
}

/** Richtet ein geschlossenes Teil so aus, dass die Flächen nach aussen zeigen. */
function orientOutward(g: THREE.BufferGeometry) {
  g.computeBoundingBox();
  const center = new THREE.Vector3();
  g.boundingBox!.getCenter(center);
  const idx = g.getIndex()!;
  const pos = g.getAttribute("position");
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m = new THREE.Vector3();
  let score = 0;
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(pos, idx.getX(i)); b.fromBufferAttribute(pos, idx.getX(i + 1)); c.fromBufferAttribute(pos, idx.getX(i + 2));
    m.copy(a).add(b).add(c).multiplyScalar(1 / 3).sub(center);
    const f = b.clone().sub(a).cross(c.clone().sub(a));
    score += Math.sign(f.dot(m));
  }
  if (score < 0) {
    const arr = idx.array as Uint32Array | Uint16Array;
    for (let i = 0; i < arr.length; i += 3) {
      const t = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = t;
    }
    idx.needsUpdate = true;
  }
  g.computeVertexNormals();
}

/* ------------------------------------------------------------------ */
/* Haupt-Generator                                                     */
/* ------------------------------------------------------------------ */

export function buildShoe(soleH: number, opts: BuildOptions = {}, shapeIn: Partial<ShapeParams> = {}): ShoeGeometry {
  const shape: ShapeParams = { ...DEFAULT_SHAPE, ...shapeIn };
  S = shape;
  const tS = throatStart();
  const opening = buildOpening(shape);
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpD = new THREE.Vector3();

  /** Punkt und Normale auf dem Leisten mit Versatz. */
  function surf(t: number, s: number, offset: number, out: THREE.Vector3, nOut: THREE.Vector3) {
    const e = 1e-3;
    // An der äussersten Spitze wird die Fläche spitz; dort die Normale von etwas weiter hinten nehmen
    const tn = Math.min(t, 0.96);
    const t0n = clamp(tn - e, 1e-4, 1), t1n = clamp(tn + e, 1e-4, 1);
    lastPoint(t1n, s, shape, tmpA); lastPoint(t0n, s, shape, tmpB);
    const dt = tmpA.sub(tmpB);
    lastPoint(tn, s + e, shape, tmpC); lastPoint(tn, s - e, shape, tmpD);
    const ds = tmpC.sub(tmpD);
    nOut.crossVectors(dt, ds).normalize();
    if (t > 0.96) nOut.add(tmpD.set(1, 0, 0).multiplyScalar(1.6 * smooth(0.96, 1, t))).normalize();
    if (!isFinite(nOut.x) || nOut.lengthSq() < 0.5) nOut.set(-1, 0, 0);
    lastPoint(t, s, shape, out);
    // Sicherheitsprüfung: Normale muss vom Inneren des Leistens weg zeigen
    const ax = tmpA.set(0, out.y, out.z - spring(clamp(t), shape) - height(clamp(t)) * 0.35);
    if (ax.lengthSq() > 1 && nOut.dot(ax) < -0.25 * ax.length()) nOut.multiplyScalar(-1);
    out.addScaledVector(nOut, offset);
  }

  const sOf = (t: number, v: number, side: Side) => {
    const s0 = opening(t);
    return side * (s0 + v * (1 - s0));
  };
  /** s, bei dem der Leisten die Höhe z (mm über der Sohle) hat */
  const sForZ = (t: number, z: number) => {
    let lo = 0, hi = 1;
    const p = new THREE.Vector3();
    for (let k = 0; k < 28; k++) {
      const mid = (lo + hi) / 2;
      lastPoint(t, mid, shape, p);
      if (p.z - spring(t, shape) > z) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const sFor = (spec: PanelSpec, t: number, v: number, side: Side) => {
    if (spec.zMap) return side * sForZ(t, lerp(spec.zMap[0], spec.zMap[1], (v - spec.a0) / (spec.a1 - spec.a0)));
    return spec.abs ? side * v : sOf(t, v, side);
  };

  /** Umfang-Faktor für UV und Nahtabstand */
  const arcScale = (t: number) => (halfWidth(t) + height(t)) * 0.8;

  function paramAt(spec: PanelSpec, i: number, j: number) {
    const fa = i / spec.segA, fb = j / spec.segB;
    if (spec.mode === "v") {
      const v = lerp(spec.a0, spec.a1, fb);
      return { t: lerp(spec.lo(v), spec.hi(v), fa), v };
    }
    const t = lerp(spec.a0, spec.a1, fa);
    return { t, v: lerp(spec.lo(t), spec.hi(t), fb) };
  }

  function buildPanel(spec: PanelSpec): { surface: THREE.BufferGeometry; stitches?: THREE.BufferGeometry } {
    const surfaces: THREE.BufferGeometry[] = [];
    const stitchParts: THREE.BufferGeometry[] = [];
    const P = new THREE.Vector3(), N = new THREE.Vector3(), Q = new THREE.Vector3(), M = new THREE.Vector3();
    for (const side of spec.sides) {
      const b = new Builder();
      const sa = spec.segA + 1, sb = spec.segB + 1;
      const sign = spec.inner ? -1 : 1;
      // Aussenfläche
      const grid: number[] = [];
      for (let i = 0; i < sa; i++) {
        for (let j = 0; j < sb; j++) {
          const { t, v } = paramAt(spec, i, j);
          const s = sFor(spec, t, v, side);
          surf(t, s, spec.layer, P, N);
          if (spec.extraZ) P.z += spec.extraZ(t, v);
          N.multiplyScalar(sign);
          const u = P.x / 100;
          const vv = (s * arcScale(t)) / 100;
          grid.push(b.vertex(P, N, u, vv));
        }
      }
      for (let i = 0; i < sa - 1; i++) {
        for (let j = 0; j < sb - 1; j++) {
          const a = grid[i * sb + j], c = grid[(i + 1) * sb + j], d = grid[(i + 1) * sb + j + 1], e = grid[i * sb + j + 1];
          b.tri(a, c, d); b.tri(a, d, e);
        }
      }
      const g = b.build(true);
      orientToNormals(g);
      surfaces.push(g);

      // Sichtbare Materialkante
      if (!spec.noWalls && spec.thick > 0) {
        const w = new Builder();
        const ring: [number, number][] = [];
        for (let i = 0; i < sa; i++) ring.push([i, 0]);
        for (let j = 1; j < sb; j++) ring.push([sa - 1, j]);
        for (let i = sa - 2; i >= 0; i--) ring.push([i, sb - 1]);
        for (let j = sb - 2; j > 0; j--) ring.push([0, j]);
        const top: number[] = [], bot: number[] = [];
        for (const [i, j] of ring) {
          const { t, v } = paramAt(spec, i, j);
          const s = sFor(spec, t, v, side);
          surf(t, s, spec.layer, P, N);
          if (spec.extraZ) P.z += spec.extraZ(t, v);
          top.push(w.vertex(P, null, P.x / 100, 0));
          surf(t, s, spec.layer - spec.thick * (spec.inner ? -1 : 1), Q, M);
          if (spec.extraZ) Q.z += spec.extraZ(t, v);
          bot.push(w.vertex(Q, null, P.x / 100, spec.thick / 100));
        }
        for (let k = 0; k < ring.length; k++) {
          const k2 = (k + 1) % ring.length;
          w.tri(top[k], bot[k], bot[k2]); w.tri(top[k], bot[k2], top[k2]);
        }
        const wg = w.build(false);
        surfaces.push(wg);
      }

      // Nähte
      if (spec.stitch) {
        const insets = spec.double && opts.doubleStitch ? [2.0, 4.6] : [2.6];
        for (const edge of spec.stitch) for (const insetMM of insets) {
          const pts: THREE.Vector3[] = [];
          const norms: THREE.Vector3[] = [];
          const count = 80;
          for (let k = 0; k <= count; k++) {
            const f = k / count;
            let t: number, v: number;
            if (spec.mode === "v") {
              v = lerp(spec.a0, spec.a1, f);
              if (edge === "lo" || edge === "hi") {
                const tt = edge === "lo" ? spec.lo(v) : spec.hi(v);
                t = tt + (edge === "lo" ? 1 : -1) * (insetMM / L);
              } else {
                t = lerp(spec.lo(v), spec.hi(v), f);
                const vv = edge === "a0" ? spec.a0 : spec.a1;
                v = vv + (edge === "a0" ? 1 : -1) * insetMM / (arcScale(t) * (spec.abs ? 1 : 1 - opening(t)) + 1e-3);
              }
            } else {
              t = lerp(spec.a0, spec.a1, f);
              if (edge === "lo" || edge === "hi") {
                const vv = edge === "lo" ? spec.lo(t) : spec.hi(t);
                v = vv + (edge === "lo" ? 1 : -1) * insetMM / (arcScale(t) * (spec.abs ? 1 : 1 - opening(t)) + 1e-3);
              } else {
                const tt = edge === "a0" ? spec.a0 : spec.a1;
                t = tt + (edge === "a0" ? 1 : -1) * (insetMM / L);
                v = lerp(spec.lo(tt), spec.hi(tt), f);
              }
            }
            const s = sFor(spec, t, v, side);
            const p = new THREE.Vector3(), n = new THREE.Vector3();
            surf(t, s, spec.layer + 0.12, p, n);
            if (spec.extraZ) p.z += spec.extraZ(t, v);
            pts.push(p); norms.push(n);
          }
          stitchParts.push(stitchLine(pts, norms));
        }
      }
    }
    return {
      surface: mergeGeometries(surfaces, false)!,
      stitches: stitchParts.length ? mergeGeometries(stitchParts, false)! : undefined,
    };
  }

  /* ---------------- Teile-Definitionen ---------------- */
  const both: Side[] = [1, -1];
  const seamQV = (v: number) => 0.6 - 0.085 * v; // Naht Seitenteil/Vorderblatt
  const capStart = shape.toecapStyle === "ttoe" ? lerp(0.9, 0.84, shape.toecapLength) : lerp(0.86, 0.73, shape.toecapLength);
  const toeLine = (v: number) => capStart - 0.035 * Math.sin(Math.PI * v) + 0.015 * v;
  const heelLine = (v: number) => (0.075 + 0.17 * Math.pow(v, 1.25)) * shape.heelCounter;
  const eyeEnd = 0.632;
  const eyeHi = (t: number) => shape.eyestayWidth * Math.sqrt(clamp((eyeEnd - t) / 0.035));
  const mudTop = 1 - lerp(0.12, 0.5, shape.mudguardHeight);
  const mudLo = (t: number) => mudTop + 0.07 * smooth(0.3, 0.9, t);

  const specs: PanelSpec[] = [
    { part: "quarter", sides: both, layer: 0, thick: 2.6, mode: "v", a0: 0, a1: 1, lo: () => 0, hi: seamQV, segA: 56, segB: 28 },
    { part: "vamp", sides: both, layer: 0, thick: 2.6, mode: "v", a0: 0, a1: 1, lo: seamQV, hi: () => 1, segA: 48, segB: 28, stitch: ["lo"] },
    ...(shape.mudguardHeight > 0.03
      ? [{ part: "mudguard", sides: both, layer: 0.9, thick: 0.9, mode: "t", a0: 0, a1: 0.9, lo: mudLo, hi: () => 1, segA: 90, segB: 8, stitch: ["lo"], abs: true, double: true } as PanelSpec]
      : []),
    ...(shape.toecapStyle !== "none"
      ? [{ part: "toecap", sides: both, layer: 1.7, thick: 0.9, mode: "v", a0: 0, a1: 1, lo: toeLine, hi: () => 1, segA: 24, segB: 24, stitch: ["lo"], abs: true, double: true } as PanelSpec]
      : []),
    ...(shape.toecapStyle === "ttoe"
      ? [{ part: "toecap", sides: both, layer: 1.7, thick: 0.9, mode: "t", a0: 0.6, a1: capStart + 0.02, lo: () => 0, hi: (t: number) => 0.1 + 0.03 * smooth(capStart - 0.08, capStart, t), segA: 30, segB: 6, stitch: ["hi"], abs: true, double: true } as PanelSpec]
      : []),
    ...(shape.heelCounter > 0.3
      ? [{ part: "heel", sides: both, layer: 1.7, thick: 0.9, mode: "v", a0: 0, a1: 1, lo: () => 0, hi: heelLine, segA: 20, segB: 24, stitch: ["hi"], double: true } as PanelSpec]
      : []),
    { part: "eyestay", sides: both, layer: 0.9, thick: 0.9, mode: "t", a0: tS + 0.005, a1: eyeEnd, lo: () => 0, hi: eyeHi, segA: 36, segB: 5, stitch: ["hi"], double: true },
    { part: "heeltab", sides: both, layer: 2.6, thick: 1.0, mode: "v", a0: -0.16, a1: 0.24, lo: () => 0, hi: () => 0.034, segA: 4, segB: 12, stitch: ["hi"], extraZ: (_t, v) => (v < 0 ? (-v / 0.16) * 10 : 0) },
    { part: "badge", sides: [1], layer: 2.6, thick: 0.7, mode: "v", a0: 0.34, a1: 0.46, lo: () => 0.155, hi: () => 0.245, segA: 10, segB: 5, zMap: [50, 41] },
    // Futter: Innenfläche über den ganzen Schaft
    { part: "lining", sides: both, layer: -2.2, thick: 0, mode: "v", a0: 0, a1: 1, lo: () => 0, hi: () => 1, segA: 90, segB: 26, inner: true, noWalls: true },
  ];

  const parts = new Map<PartId, PartGeometry>();
  for (const spec of specs) {
    const { surface, stitches } = buildPanel(spec);
    const existing = parts.get(spec.part);
    if (existing) {
      existing.surface = mergeGeometries([existing.surface, surface])!;
    } else {
      parts.set(spec.part, { part: spec.part, surface, stitches });
    }
  }

  /* ---------------- Perforation auf der Zehenkappe ---------------- */
  if (opts.perforation && parts.get("toecap")) {
    const holes: THREE.BufferGeometry[] = [];
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    for (const side of both) {
      for (let row = 0; row < 9; row++) {
        const v = 0.06 + row * 0.075;
        const tStart = toeLine(v) + 0.03;
        const nCols = Math.floor((0.975 - tStart) / 0.019);
        for (let c = 0; c <= nCols; c++) {
          const t = tStart + c * 0.019 + (row % 2 ? 0.0095 : 0);
          if (t > 0.975) continue;
          const sAbs = v;
          if (side === -1 && sAbs < 0.04) continue;
          surf(t, side * sAbs, 1.7 + 0.06, P, N);
          const pt = new THREE.Vector3(P.x - L / 2, P.z, P.y);
          const nt = new THREE.Vector3(N.x, N.z, N.y).normalize();
          const g = new THREE.CircleGeometry(0.95, 10);
          g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nt));
          g.translate(pt.x, pt.y, pt.z);
          holes.push(g);
        }
      }
    }
    parts.get("toecap")!.dark = mergeGeometries(holes)!;
  }

  /* ---------------- Logo-Fläche auf dem Patch ---------------- */
  {
    const b = new Builder();
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    const sa = 21, sb = 9, grid: number[] = [];
    for (let i = 0; i < sa; i++) for (let j = 0; j < sb; j++) {
      const u = i / (sa - 1), w = j / (sb - 1);
      const t = lerp(0.155, 0.245, u);
      surf(t, sForZ(t, lerp(50, 41, w)), 2.6 + 0.07, P, N);
      grid.push(b.vertex(P, N, u, w));
    }
    for (let i = 0; i < sa - 1; i++) for (let j = 0; j < sb - 1; j++) {
      const a = grid[i * sb + j], c = grid[(i + 1) * sb + j], d = grid[(i + 1) * sb + j + 1], e = grid[i * sb + j + 1];
      b.tri(a, c, d); b.tri(a, d, e);
    }
    const g = b.build(true);
    orientToNormals(g);
    parts.get("badge")!.label = g;
  }

  /* ---------------- Zunge ---------------- */
  {
    const tongueS = 0.31;
    const tStart = (s: number) => tS - 0.04 - shape.tongueHeight * 0.0022 + 0.035 * Math.pow(s / tongueS, 2);
    const tongueGeos: THREE.BufferGeometry[] = [];
    const tongueStitches: THREE.BufferGeometry[] = [];
    // Geteilte Zunge («Split Tongue»): zwei Hälften mit Spalt in der Mitte
    const halves: [number, number][] = shape.tongueSplit ? [[-tongueS, -0.03], [0.03, tongueS]] : [[-tongueS, tongueS]];
    for (const [ha0, ha1] of halves) {
    const spec: PanelSpec = { part: "tongue", sides: [1], layer: -1.4, thick: 3.2, mode: "v", a0: ha0, a1: ha1, lo: (s) => tStart(s), hi: () => 0.66, segA: 36, segB: shape.tongueSplit ? 12 : 22 };
    // Zunge: eigene Abbildung, s direkt
    const b = new Builder();
    const P = new THREE.Vector3(), N = new THREE.Vector3();
    const sa = spec.segA + 1, sb = spec.segB + 1;
    const grid: number[] = [];
    for (let i = 0; i < sa; i++) {
      for (let j = 0; j < sb; j++) {
        const s = lerp(spec.a0, spec.a1, j / spec.segB);
        const t = lerp(spec.lo(s), spec.hi(s), i / spec.segA);
        // Zunge steht oben etwas vom Fuss ab
        const lift = (4 + shape.tongueHeight * 0.5) * (1 - smooth(tS - 0.06, tS + 0.01, t));
        surf(t, s * 0.92, spec.layer + lift, P, N);
        grid.push(b.vertex(P, N, P.x / 100, (s * arcScale(t)) / 100));
      }
    }
    for (let i = 0; i < sa - 1; i++) for (let j = 0; j < sb - 1; j++) {
      const a = grid[i * sb + j], c = grid[(i + 1) * sb + j], d = grid[(i + 1) * sb + j + 1], e = grid[i * sb + j + 1];
      b.tri(a, c, d); b.tri(a, d, e);
    }
    const g = b.build(true);
    orientToNormals(g);
    // Rückseite der Zunge (Futterseite) für die Dicke
    const back = new Builder();
    const gridB: number[] = [];
    for (let i = 0; i < sa; i++) {
      for (let j = 0; j < sb; j++) {
        const s = lerp(spec.a0, spec.a1, j / spec.segB);
        const t = lerp(spec.lo(s), spec.hi(s), i / spec.segA);
        const lift = (4 + shape.tongueHeight * 0.5) * (1 - smooth(tS - 0.06, tS + 0.01, t));
        const pad = 4.5 * Math.cos((s / tongueS) * Math.PI / 2) * (1 - smooth(0.5, 0.66, t));
        surf(t, s * 0.92, spec.layer + lift - pad - 1.2, P, N);
        N.multiplyScalar(-1);
        gridB.push(back.vertex(P, N, P.x / 100, (s * arcScale(t)) / 100));
      }
    }
    for (let i = 0; i < sa - 1; i++) for (let j = 0; j < sb - 1; j++) {
      const a = gridB[i * sb + j], c = gridB[(i + 1) * sb + j], d = gridB[(i + 1) * sb + j + 1], e = gridB[i * sb + j + 1];
      back.tri(a, d, c); back.tri(a, e, d);
    }
    const gb = back.build(true);
    orientToNormals(gb);
    // Rand der Zunge
    const rim = new Builder();
    const top: number[] = [], bot: number[] = [];
    const ring: [number, number][] = [];
    for (let j = 0; j < sb; j++) ring.push([0, j]);
    for (let i = 1; i < sa; i++) ring.push([i, sb - 1]);
    for (let i = sa - 2; i >= 0; i--) ring.push([i, 0]);
    for (const [i, j] of ring) {
      const s = lerp(spec.a0, spec.a1, j / spec.segB);
      const t = lerp(spec.lo(s), spec.hi(s), i / spec.segA);
      const lift = (4 + shape.tongueHeight * 0.5) * (1 - smooth(tS - 0.06, tS + 0.01, t));
      const pad = 4.5 * Math.cos((s / tongueS) * Math.PI / 2) * (1 - smooth(0.5, 0.66, t));
      surf(t, s * 0.92, spec.layer + lift, P, N);
      top.push(rim.vertex(P, null, P.x / 100, 0));
      surf(t, s * 0.92, spec.layer + lift - pad - 1.2, P, N);
      bot.push(rim.vertex(P, null, P.x / 100, 0.04));
    }
    for (let k = 0; k < ring.length - 1; k++) { rim.tri(top[k], bot[k], bot[k + 1]); rim.tri(top[k], bot[k + 1], top[k + 1]); }
    const gr = rim.build(false);
    // Naht rund um die Zunge
    const pts: THREE.Vector3[] = [], nors: THREE.Vector3[] = [];
    for (let k = 0; k <= 60; k++) {
      const f = k / 60;
      const s = lerp(spec.a0 + (spec.a0 < -0.1 ? 0.03 : 0.012), spec.a1 - (spec.a1 > 0.1 ? 0.03 : 0.012), f);
      const t = spec.lo(s) + 0.012;
      const p = new THREE.Vector3(), n = new THREE.Vector3();
      surf(t, s * 0.92, spec.layer + (4 + shape.tongueHeight * 0.5) * (1 - smooth(tS - 0.06, tS + 0.01, t)) + 0.12, p, n);
      pts.push(p); nors.push(n);
    }
    tongueGeos.push(g, gb, gr);
    tongueStitches.push(stitchLine(pts, nors));
    }
    parts.set("tongue", { part: "tongue", surface: mergeGeometries(tongueGeos)!, stitches: mergeGeometries(tongueStitches)! });
  }

  /* ---------------- Kragen-Polster ---------------- */
  {
    const P = new THREE.Vector3(), N = new THREE.Vector3(), O = new THREE.Vector3(), up = new THREE.Vector3();
    const geos: THREE.BufferGeometry[] = [];
    for (const side of both) {
      const path: THREE.Vector3[] = [];
      const tEnd = tS + 0.015;
      for (let k = 0; k <= 60; k++) {
        const t = (k / 60) * tEnd;
        const s = sOf(t, 0, side);
        surf(t, s, -1.0, P, N);
        // etwas nach unten an die Kante setzen
        surf(t, sOf(t, 0.02, side), -1.0, O, up);
        path.push(new THREE.Vector3(P.x - L / 2, P.z, P.y));
      }
      const curve = new THREE.CatmullRomCurve3(path);
      geos.push(taperedTube(curve, 80, 3.4 + 1.6 * S.collar, 10));
    }
    const lining = parts.get("lining")!;
    // Einlegesohle
    const sock = soleOutline(-2.5);
    const shapeSock = new THREE.Shape(sock.map((p) => new THREE.Vector2(p.x, p.y)));
    const sockGeo = new THREE.ShapeGeometry(shapeSock, 1);
    const sp = sockGeo.getAttribute("position");
    for (let i = 0; i < sp.count; i++) {
      const x = sp.getX(i), y = sp.getY(i);
      const z = 6 + spring(clamp(x / L), shape);
      sp.setXYZ(i, x - L / 2, z, y);
    }
    sockGeo.computeVertexNormals();
    const sockUv = sockGeo.getAttribute("uv");
    for (let i = 0; i < sockUv.count; i++) sockUv.setXY(i, sp.getX(i) / 100, sp.getZ(i) / 100);
    lining.surface = mergeGeometries([lining.surface, ...geos.map(stripToIndexed), sockGeo.index ? sockGeo : sockGeo])!;
  }

  /* ---------------- Ösen und Schnürsenkel ---------------- */
  const eyeCount = shape.eyelets > 0 ? Math.round(shape.eyelets) : Math.max(5, Math.round((0.598 - (tS + 0.05)) / 0.054) + 1);
  const eyeT = Array.from({ length: eyeCount }, (_, i) => lerp(tS + 0.05, 0.598, i / (eyeCount - 1)));
  const eyeV = 0.07;
  const eyelets: { p: THREE.Vector3; n: THREE.Vector3 }[][] = [[], []];
  {
    const geos: THREE.BufferGeometry[] = [];
    const holes: THREE.BufferGeometry[] = [];
    both.forEach((side, si) => {
      for (const t of eyeT) {
        const p = new THREE.Vector3(), n = new THREE.Vector3();
        surf(t, sOf(t, eyeV, side), 1.9, p, n);
        const pt = new THREE.Vector3(p.x - L / 2, p.z, p.y);
        const nt = new THREE.Vector3(n.x, n.z, n.y).normalize();
        eyelets[si].push({ p: pt, n: nt });
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), nt);
        const tor = new THREE.TorusGeometry(2.7, 0.85, 8, 20);
        tor.applyQuaternion(q); tor.translate(pt.x, pt.y, pt.z);
        geos.push(tor);
        const hole = new THREE.CircleGeometry(2.0, 16);
        hole.applyQuaternion(q); hole.translate(pt.x - nt.x * 0.3, pt.y - nt.y * 0.3, pt.z - nt.z * 0.3);
        holes.push(hole);
      }
    });
    const ey = parts.get("eyestay")!;
    ey.eyelets = mergeGeometries(geos)!;
    ey.dark = mergeGeometries(holes)!;
  }
  {
    const geos: THREE.BufferGeometry[] = [];
    const aglets: THREE.BufferGeometry[] = [];
    const lat = eyelets[0], med = eyelets[1];
    const n = eyeT.length;
    const lift = (a: THREE.Vector3, b: THREE.Vector3, h: number) => {
      const m = a.clone().add(b).multiplyScalar(0.5);
      const t = clamp((m.x + L / 2) / L);
      const p = new THREE.Vector3(), nn = new THREE.Vector3();
      surf(t, 0, 0, p, nn);
      const top = new THREE.Vector3(p.x - L / 2, p.z, p.y);
      const nt = new THREE.Vector3(nn.x, nn.z, nn.y);
      return top.addScaledVector(nt, h);
    };
    const lace = (a: THREE.Vector3, b: THREE.Vector3, h: number) => {
      const mid = lift(a, b, h);
      const c = new THREE.QuadraticBezierCurve3(a, mid, b);
      geos.push(flatTube(c, 22, shape.laceWidth, 1.6));
    };
    // vorne quer
    lace(lat[n - 1].p, med[n - 1].p, 3.6);
    for (let k = n - 1; k > 0; k--) {
      lace(lat[k].p, med[k - 1].p, 4.6);
      lace(med[k].p, lat[k - 1].p, 6.4);
    }
    // Schleife oben
    const knot = lift(lat[0].p, med[0].p, 5.5);
    const sideDir = new THREE.Vector3(0, 0, 1);
    const back = new THREE.Vector3(-1, 0.25, 0).normalize();
    const loop = (dir: number) => {
      const p0 = knot.clone();
      const p1 = knot.clone().addScaledVector(sideDir, dir * 10).addScaledVector(back, 9).add(new THREE.Vector3(0, 2.5, 0));
      const p2 = knot.clone().addScaledVector(sideDir, dir * 21).addScaledVector(back, 3).add(new THREE.Vector3(0, -3, 0));
      const p3 = knot.clone().addScaledVector(sideDir, dir * 12).addScaledVector(back, -6).add(new THREE.Vector3(0, -2.5, 0));
      const c = new THREE.CatmullRomCurve3([p0, p1, p2, p3, knot.clone().add(new THREE.Vector3(0.5, -0.5, 0))], false, "centripetal");
      geos.push(flatTube(c, 40, shape.laceWidth, 1.6));
    };
    loop(1); loop(-1);
    const end = (dir: number, len: number) => {
      // Das Ende fällt über die Ösenleiste und liegt seitlich am Schaft an
      const onSurf = (t: number, v: number, off: number) => {
        const p = new THREE.Vector3(), n = new THREE.Vector3();
        surf(t, sOf(t, v, dir > 0 ? 1 : -1), off, p, n);
        return new THREE.Vector3(p.x - L / 2, p.z, p.y);
      };
      const p0 = knot.clone();
      const p1 = knot.clone().addScaledVector(sideDir, dir * 9).add(new THREE.Vector3(3, -1, 0));
      const p2 = onSurf(tS + 0.065, 0.04, 5.5);
      const p3 = onSurf(tS + 0.08 + len * 0.0004, 0.12 + len * 0.004, 3.4);
      const p4 = onSurf(tS + 0.09 + len * 0.0006, 0.16 + len * 0.007, 3.0);
      const c = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4], false, "centripetal");
      geos.push(flatTube(c, 40, shape.laceWidth, 1.6));
      // Kunststoff-Ende (Aglet)
      const tip = c.getPointAt(1), dirT = c.getTangentAt(1);
      const ag = new THREE.CylinderGeometry(1.9, 1.9, 15, 12, 1);
      ag.translate(0, 7.5, 0);
      ag.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirT));
      ag.translate(tip.x - dirT.x * 2, tip.y - dirT.y * 2, tip.z - dirT.z * 2);
      aglets.push(ag);
    };
    end(1, 30); end(-1, 22);
    // Knoten
    const k = new THREE.SphereGeometry(4.2, 14, 10);
    k.scale(1.3, 0.75, 1.1); k.translate(knot.x, knot.y, knot.z);
    geos.push(k);
    parts.set("laces", { part: "laces", surface: mergeGeometries(geos.map(stripToIndexed))!, aglets: mergeGeometries(aglets.map(stripToIndexed))! });
  }

  /* ---------------- Cupsole ---------------- */
  const sole = buildSole(soleH, shape);
  parts.set("midsole", sole.midsole);
  parts.set("outsole", sole.outsole);

  const order: PartId[] = ["quarter", "vamp", "toecap", "mudguard", "heel", "heeltab", "eyestay", "tongue", "lining", "badge", "laces", "midsole", "outsole"];
  return { parts: order.map((id) => parts.get(id)!).filter(Boolean), groundOffset: soleH - rimFor(shape)(0) };
}

/* ------------------------------------------------------------------ */
/* Nähte                                                               */
/* ------------------------------------------------------------------ */

/** Erzeugt einzelne Stiche (kleine Garnstücke) entlang einer Linie. */
function stitchLine(pts: THREE.Vector3[], norms: THREE.Vector3[], stitchLen = 2.3, gap = 1.3): THREE.BufferGeometry {
  // pts/norms in internen Koordinaten (mm)
  const b = new Builder();
  const P = (p: THREE.Vector3) => p;
  const total: number[] = [0];
  for (let i = 1; i < pts.length; i++) total.push(total[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const length = total[total.length - 1];
  const at = (d: number, out: THREE.Vector3, nOut: THREE.Vector3) => {
    let i = 1;
    while (i < total.length - 1 && total[i] < d) i++;
    const f = (d - total[i - 1]) / Math.max(1e-6, total[i] - total[i - 1]);
    out.lerpVectors(pts[i - 1], pts[i], f);
    nOut.lerpVectors(norms[i - 1], norms[i], f).normalize();
  };
  const a = new THREE.Vector3(), c = new THREE.Vector3(), na = new THREE.Vector3(), nc = new THREE.Vector3();
  const w = 0.42, h = 0.32;
  for (let d = 0.6; d + stitchLen < length; d += stitchLen + gap) {
    at(d, a, na); at(d + stitchLen, c, nc);
    const T = c.clone().sub(a).normalize();
    const n = na.clone().add(nc).normalize();
    const B = new THREE.Vector3().crossVectors(n, T).normalize();
    // kleiner flacher Quader mit gerundeter Oberseite (3 Flächen)
    const quads: [number, number][] = [[-1, 0], [-0.4, 1], [0.4, 1], [1, 0]];
    const rowA: number[] = [], rowC: number[] = [];
    for (const [bx, hz] of quads) {
      const off = B.clone().multiplyScalar(bx * w).addScaledVector(n, hz * h);
      const nn = B.clone().multiplyScalar(bx).addScaledVector(n, hz + 0.3).normalize();
      rowA.push(b.vertex(P(a.clone().add(off)), nn, 0, 0));
      rowC.push(b.vertex(P(c.clone().add(off)), nn, 1, 0));
    }
    for (let k = 0; k < 3; k++) {
      b.tri(rowA[k], rowC[k], rowC[k + 1]);
      b.tri(rowA[k], rowC[k + 1], rowA[k + 1]);
    }
  }
  const g = b.build(true);
  orientToNormals(g);
  return g;
}

/* ------------------------------------------------------------------ */
/* Sohle                                                               */
/* ------------------------------------------------------------------ */

/** Umriss des Fussabdrucks, nach aussen versetzt (interne XY-Koordinaten). */
function soleOutline(offset: number): THREE.Vector2[] {
  const N = 90;
  const raw: THREE.Vector2[] = [];
  const ts: number[] = [];
  for (let i = 0; i <= N; i++) {
    // dichter an den Enden
    const u = i / N;
    ts.push(0.5 - 0.5 * Math.cos(Math.PI * u));
  }
  for (const t of ts) raw.push(new THREE.Vector2(t * L, halfWidth(t)));
  for (let i = ts.length - 2; i > 0; i--) raw.push(new THREE.Vector2(ts[i] * L, -halfWidth(ts[i])));
  // Duplikate entfernen
  const pts = raw.filter((p, i) => i === 0 || p.distanceTo(raw[i - 1]) > 0.05);
  const n = pts.length;
  const out: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
    const tan = next.clone().sub(prev).normalize();
    // Polygon läuft lateral (y>0) von hinten nach vorne → aussen ist rechts der Laufrichtung gespiegelt
    const nor = new THREE.Vector2(-tan.y, tan.x);
    // sicherstellen, dass die Normale nach aussen zeigt
    const c = new THREE.Vector2(L / 2, 0);
    if (nor.dot(pts[i].clone().sub(c)) < 0) nor.multiplyScalar(-1);
    out.push(pts[i].clone().addScaledVector(nor, offset));
  }
  return out;
}

function buildSole(soleH: number, shape: ShapeParams): { midsole: PartGeometry; outsole: PartGeometry } {
  const type = shape.soleType;
  const rimAt = rimFor(shape);
  const RIMH = rimAt(0);
  // Wie stark die Sohle nach vorne dünner wird
  const taper = type === "runner" ? 0.42 : type === "vulc" ? 0.08 : type === "chunky" ? 0.16 : type === "lug" ? 0.1 : 0.2;
  const bottomAt = (t: number) => RIMH - soleH * (1 - taper * smooth(0.18, 0.88, t));
  const outT = type === "vulc" ? 5 : type === "runner" ? 6 : type === "lug" ? 14 : 8.5;
  const splitAt = (t: number) => bottomAt(t) + outT;
  const flare = shape.soleFlare + (type === "chunky" ? 2.5 : 0);
  type Ring = { z: (t: number, acc: number) => number; off: number };
  // Profilsohle: Stollen an der Seitenwand
  const lugZ = (t: number, acc: number) => bottomAt(t) + 5.5 + (Math.sin(acc / 5.2) > 0 ? 2.8 : 0);
  const outRings: Ring[] = type === "lug" ? [
    { z: (t) => bottomAt(t), off: 1.2 + flare },
    { z: (t) => bottomAt(t) + 0.8, off: 3.2 + flare },
    { z: (t, a) => lugZ(t, a), off: 3.6 + flare },
    { z: (t, a) => lugZ(t, a) + 0.4, off: 2.8 + flare },
    { z: (t) => splitAt(t) - 3, off: 2.8 + flare },
    { z: (t) => splitAt(t) - 2.4, off: 3.5 + flare },
    { z: (t) => splitAt(t) - 0.6, off: 3.6 + flare },
    { z: (t) => splitAt(t), off: 3.0 + flare },
  ] : [
    { z: (t) => bottomAt(t), off: 0.9 + flare },
    { z: (t) => bottomAt(t) + 0.8, off: 2.1 + flare },
    { z: (t) => bottomAt(t) + 2.5, off: 2.9 + flare },
    { z: (t) => splitAt(t) - 0.6, off: 3.0 + flare },
    { z: (t) => splitAt(t), off: 2.5 + flare },
  ];
  const bulge = Math.min(1.0, (soleH - 20) * 0.04);
  let midRings: Ring[];
  if (type === "vulc") {
    // Gerade Gummiwand (Foxing) mit zwei Zierstreifen
    const m = (t: number, f: number) => lerp(splitAt(t), rimAt(t), f);
    midRings = [
      { z: (t) => splitAt(t), off: 2.5 },
      { z: (t) => splitAt(t) + 0.5, off: 2.2 },
      { z: (t) => m(t, 0.3), off: 2.2 },
      { z: (t) => m(t, 0.3) + 0.5, off: 1.7 },
      { z: (t) => m(t, 0.3) + 1.6, off: 1.7 },
      { z: (t) => m(t, 0.3) + 2.1, off: 2.2 },
      { z: (t) => m(t, 0.62), off: 2.2 },
      { z: (t) => m(t, 0.62) + 0.5, off: 1.75 },
      { z: (t) => m(t, 0.62) + 1.2, off: 1.75 },
      { z: (t) => m(t, 0.62) + 1.7, off: 2.2 },
      { z: (t) => rimAt(t) - 1.2, off: 2.0 },
      { z: (t) => rimAt(t), off: 1.1 },
      { z: (t) => rimAt(t) + 0.2, off: 0.2 },
    ];
  } else if (type === "chunky") {
    // Massive, nach unten ausgestellte Sohle mit geschwungener Linie
    const wave = (t: number, acc: number) => lerp(splitAt(t), RIMH, 0.45) + Math.sin(acc / 38) * Math.min(6, soleH * 0.09);
    midRings = [
      { z: (t) => splitAt(t), off: 2.5 + flare },
      { z: (t) => splitAt(t) + 0.8, off: 3.4 + flare },
      { z: (t, a) => wave(t, a) - 1.2, off: 3.3 + flare * 0.8 + bulge },
      { z: (t, a) => wave(t, a), off: 2.4 + flare * 0.7 },
      { z: (t, a) => wave(t, a) + 1.4, off: 2.4 + flare * 0.6 },
      { z: (t, a) => wave(t, a) + 2.6, off: 3.3 + flare * 0.5 + bulge },
      { z: () => RIMH - 3, off: 3.4 + flare * 0.3 },
      { z: () => RIMH - 0.9, off: 2.8 },
      { z: () => RIMH, off: 1.8 },
      { z: () => RIMH + 0.25, off: 0.3 },
    ];
  } else if (type === "lug") {
    // Stiefelsohle mit umlaufendem, vernähtem Rand (Welt)
    midRings = [
      { z: (t) => splitAt(t), off: 3.0 + flare },
      { z: (t) => splitAt(t) + 0.6, off: 3.6 + flare },
      { z: () => RIMH - 4.6, off: 3.6 + flare },
      { z: () => RIMH - 4.2, off: 5.4 + flare },
      { z: () => RIMH - 3.2, off: 5.6 + flare },
      { z: () => RIMH - 2.9, off: 2.9 },
      { z: () => RIMH - 0.9, off: 2.6 },
      { z: () => RIMH, off: 1.7 },
      { z: () => RIMH + 0.25, off: 0.3 },
    ];
  } else if (type === "runner") {
    // Keilförmige EVA-Zwischensohle mit schräger Rille
    const diag = (t: number) => lerp(splitAt(t), rimAt(t), lerp(0.62, 0.3, smooth(0.1, 0.8, t)));
    midRings = [
      { z: (t) => splitAt(t), off: 2.5 + flare },
      { z: (t) => splitAt(t) + 0.7, off: 3.2 + flare },
      { z: (t) => diag(t) - 0.5, off: 3.4 + flare * 0.7 + bulge },
      { z: (t) => diag(t), off: 2.6 + flare * 0.6 },
      { z: (t) => diag(t) + 1.2, off: 2.6 + flare * 0.5 },
      { z: (t) => diag(t) + 1.8, off: 3.2 + flare * 0.4 },
      { z: (t) => rimAt(t) - 2, off: 3.0 },
      { z: (t) => rimAt(t) - 0.6, off: 2.3 },
      { z: (t) => rimAt(t), off: 1.4 },
      { z: (t) => rimAt(t) + 0.25, off: 0.3 },
    ];
  } else {
    midRings = [
      { z: (t) => splitAt(t), off: 2.5 },
      { z: (t) => splitAt(t) + 0.7, off: 3.1 },
      { z: (t) => lerp(splitAt(t), RIMH, 0.42), off: 3.1 + bulge },
      { z: (t) => lerp(splitAt(t), RIMH, 0.42) + 0.6, off: 2.55 + bulge },
      { z: (t) => lerp(splitAt(t), RIMH, 0.42) + 1.6, off: 2.55 + bulge },
      { z: (t) => lerp(splitAt(t), RIMH, 0.42) + 2.2, off: 3.1 + bulge },
      { z: () => RIMH - 3, off: 3.2 },
      { z: () => RIMH - 0.9, off: 2.6 },
      { z: () => RIMH, off: 1.7 },
      { z: () => RIMH + 0.25, off: 0.3 },
    ];
  }

  const base = soleOutline(0);
  const n = base.length;
  const outlines = new Map<number, THREE.Vector2[]>();
  const getOutline = (off: number) => {
    if (!outlines.has(off)) outlines.set(off, soleOutline(off));
    return outlines.get(off)!;
  };
  const springAt = (t: number) => spring(t, shape);

  function ringsGeometry(rings: Ring[]) {
    const b = new Builder();
    const rows: number[][] = [];
    for (const ring of rings) {
      const ol = getOutline(ring.off);
      const row: number[] = [];
      let acc = 0;
      for (let i = 0; i <= n; i++) {
        const p = ol[i % n];
        if (i > 0) acc += p.distanceTo(ol[(i - 1) % n]);
        const t = clamp(p.x / L);
        const z = ring.z(t, acc);
        row.push(b.vertex(new THREE.Vector3(p.x, p.y, z + springAt(t)), null, acc / 100, z / 100));
      }
      rows.push(row);
    }
    for (let r = 0; r < rows.length - 1; r++) {
      for (let i = 0; i < n; i++) {
        b.tri(rows[r][i], rows[r + 1][i], rows[r + 1][i + 1]);
        b.tri(rows[r][i], rows[r + 1][i + 1], rows[r][i + 1]);
      }
    }
    return b;
  }

  // Laufsohle: Seitenwand + Boden
  const ob = ringsGeometry(outRings);
  const outWall = ob.build(false);
  const bottomOl = getOutline(outRings[0].off);
  const tris = THREE.ShapeUtils.triangulateShape(bottomOl, []);
  const bb = new Builder();
  const ids = bottomOl.map((p) => {
    const t = clamp(p.x / L);
    return bb.vertex(new THREE.Vector3(p.x, p.y, bottomAt(t) + springAt(t)), null, p.x / 100, p.y / 100);
  });
  for (const [a, c, d] of tris) bb.tri(ids[a], ids[c], ids[d]);
  const bottom = bb.build(false);
  const outGeo = stripNormals(outWall);
  orientOutward(outGeo);
  // Unterseite mit Profil: Normalen zeigen nach unten
  bottom.computeVertexNormals();
  const bn = bottom.getAttribute("normal");
  if (bn.getY(0) > 0) {
    const arr = bottom.getIndex()!.array as Uint32Array | Uint16Array;
    for (let i = 0; i < arr.length; i += 3) { const t = arr[i + 1]; arr[i + 1] = arr[i + 2]; arr[i + 2] = t; }
    bottom.computeVertexNormals();
  }

  // Zwischensohle
  const mb = ringsGeometry(midRings);
  const midGeo = mb.build(false);
  orientOutward(midGeo);

  // Naht rund um die Cupsole
  const stitchZ = type === "lug" ? RIMH - 3.1 : RIMH - 5.2;
  const ol = getOutline(type === "lug" ? 4.3 + flare : 3.22 + (type === "chunky" ? flare * 0.3 : 0));
  const pts: THREE.Vector3[] = [], nors: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const p = ol[i % n];
    const prev = ol[(i - 1 + n) % n], next = ol[(i + 1) % n];
    const tan = next.clone().sub(prev).normalize();
    let nor = new THREE.Vector2(-tan.y, tan.x);
    if (nor.dot(p.clone().sub(new THREE.Vector2(L / 2, 0))) < 0) nor = nor.multiplyScalar(-1);
    pts.push(new THREE.Vector3(p.x, p.y, stitchZ + springAt(clamp(p.x / L))));
    nors.push(type === "lug" ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(nor.x, nor.y, 0));
  }
  // Vulkanisierte und Runner-Sohlen haben keine umlaufende Naht
  const stitches = type === "cupsole" || type === "chunky" || type === "lug" ? stitchLine(pts, nors, type === "lug" ? 3.6 : 3.0, type === "lug" ? 1.4 : 1.6) : undefined;

  return {
    midsole: { part: "midsole", surface: midGeo, stitches },
    outsole: { part: "outsole", surface: outGeo, tread: bottom },
  };
}

function stripNormals(g: THREE.BufferGeometry) {
  g.deleteAttribute("normal");
  return g;
}

/** Bringt Geometrien auf dieselben Attribute (position, normal, uv) und einen Index. */
function stripToIndexed(g: THREE.BufferGeometry) {
  const keep = ["position", "normal", "uv"];
  for (const name of Object.keys(g.attributes)) if (!keep.includes(name)) g.deleteAttribute(name);
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  if (!g.getAttribute("uv")) {
    const count = g.getAttribute("position").count;
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
  }
  if (!g.index) {
    const count = g.getAttribute("position").count;
    const idx: number[] = [];
    for (let i = 0; i < count; i++) idx.push(i);
    g.setIndex(idx);
  }
  return g;
}

/** Rundes Polster entlang einer Kurve, das zum Ende hin ausläuft (kein offenes Rohrende). */
function taperedTube(curve: THREE.Curve<THREE.Vector3>, seg: number, radius: number, radial: number) {
  const frames = curve.computeFrenetFrames(seg, false);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const r = radius * Math.sqrt(clamp((1 - u) / 0.14));
    const p = curve.getPointAt(u);
    const N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const n = new THREE.Vector3().addScaledVector(N, Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos.push(p.x + n.x * r, p.y + n.y * r, p.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(u * 2, j / radial * 0.2);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  orientToNormals(g);
  return g;
}

/** Flacher Schnürsenkel entlang einer Kurve (Breite w, Dicke d), Ausgabe in three.js-Koordinaten. */
function flatTube(curve: THREE.Curve<THREE.Vector3>, seg: number, w: number, d: number) {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  const radial = 8;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= seg; i++) {
    const p = curve.getPointAt(i / seg);
    const T = curve.getTangentAt(i / seg);
    // Breite liegt flach (quer zur Laufrichtung), Dicke zeigt nach oben
    let N = new THREE.Vector3().crossVectors(T, up);
    if (N.lengthSq() < 1e-4) N = new THREE.Vector3(1, 0, 0);
    N.normalize();
    const B = new THREE.Vector3().crossVectors(N, T).normalize();
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const cx = Math.cos(a) * (w / 2), cy = Math.sin(a) * (d / 2);
      const v = new THREE.Vector3().addScaledVector(N, cx).addScaledVector(B, cy);
      pos.push(p.x + v.x, p.y + v.y, p.z + v.z);
      const nn = new THREE.Vector3().addScaledVector(N, Math.cos(a) / w).addScaledVector(B, Math.sin(a) / d).normalize();
      nor.push(nn.x, nn.y, nn.z);
      uv.push(i / seg * 0.5, j / radial * 0.05);
    }
  }
  for (let i = 0; i < seg; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = (i + 1) * (radial + 1) + j;
    idx.push(a, b, b + 1, a, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  orientToNormals(g);
  return g;
}

/** Richtung, in die ein Teil im Bau-Modus auseinanderfliegt (mm, three.js-Koordinaten). */
export const EXPLODE: Record<PartId, [number, number, number]> = {
  lining: [0, 0, 0],
  quarter: [-14, 6, 0],
  vamp: [22, 6, 0],
  mudguard: [0, -10, 0],
  toecap: [62, 4, 0],
  heel: [-58, 0, 0],
  heeltab: [-82, 18, 0],
  eyestay: [6, 34, 0],
  tongue: [12, 70, 0],
  badge: [-6, 8, 30],
  laces: [8, 104, 0],
  midsole: [0, -46, 0],
  outsole: [0, -74, 0],
};
