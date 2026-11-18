/**
 * Modell-Bibliothek: Grundformen (Silhouetten), die nur die Form ändern und deine Farben behalten.
 * Dazu ein einfacher Wunsch-Assistent, der eine Beschreibung in Form und Farben übersetzt.
 */
import type { ShapeParams, SoleType } from "./geometry";
import { PALETTE } from "./catalog";
import type { MaterialId, PartId } from "./types";

export interface ModelPreset {
  id: string;
  name: string;
  tag: string;
  text: string;
  shape: Partial<ShapeParams>;
  soleH: number;
}

export const MODELS: ModelPreset[] = [
  { id: "court-low", name: "Court Low", tag: "Cupsole", text: "Der Klassiker: clean, flach, zeitlos. Basis für fast jede Casual-Marke.", soleH: 32, shape: { collar: 0, soleType: "cupsole", toeSpring: 11, toeWidth: 1, toeHeight: 1, toeRound: 0.5, width: 1, soleFlare: 0 } },
  { id: "slim-court", name: "Slim Court", tag: "Minimal", text: "Schmaler und flacher, mit dünner Sohle. Wirkt elegant und erwachsen.", soleH: 27, shape: { collar: 0, soleType: "cupsole", toeSpring: 9, toeWidth: 0.9, toeHeight: 0.9, toeRound: 0.38, width: 0.96, soleFlare: 0 } },
  { id: "court-mid", name: "Court Mid", tag: "Mid-Top", text: "Schaft bis knapp unter den Knöchel. Mehr Halt, mehr Präsenz.", soleH: 32, shape: { collar: 0.5, soleType: "cupsole", toeSpring: 11, toeWidth: 1, toeHeight: 1, toeRound: 0.55, width: 1, soleFlare: 0 } },
  { id: "hoop-high", name: "Hoop High", tag: "High-Top", text: "Basketball-Erbe: hoher Schaft, gepolsterter Kragen, lange Schnürung.", soleH: 34, shape: { collar: 1, soleType: "cupsole", toeSpring: 12, toeWidth: 1.02, toeHeight: 1.04, toeRound: 0.6, width: 1.02, soleFlare: 0.5 } },
  { id: "skate-vulc", name: "Skate Vulc", tag: "Vulkanisiert", text: "Flache, flexible Gummisohle mit Zehenkappe aus Gummi. Typisch für Canvas.", soleH: 22, shape: { collar: 0, soleType: "vulc", toeSpring: 6, toeWidth: 1.02, toeHeight: 0.92, toeRound: 0.72, width: 1.02, soleFlare: 0 } },
  { id: "skate-high", name: "Skate High", tag: "Vulkanisiert", text: "Hoher Canvas-Schuh auf flacher vulkanisierter Sohle.", soleH: 22, shape: { collar: 0.9, soleType: "vulc", toeSpring: 6, toeWidth: 1.02, toeHeight: 0.92, toeRound: 0.72, width: 1, soleFlare: 0 } },
  { id: "chunky", name: "Chunky Platform", tag: "Chunky", text: "Massive, ausgestellte Sohle mit geschwungener Linie. Dein Statement-Modell.", soleH: 52, shape: { collar: 0.05, soleType: "chunky", toeSpring: 13, toeWidth: 1.08, toeHeight: 1.1, toeRound: 0.65, width: 1.04, soleFlare: 3 } },
  { id: "retro-runner", name: "Retro Runner", tag: "Runner", text: "Keilsohle, die nach vorne dünner wird, schmale Spitze, viel Zehenhub.", soleH: 36, shape: { collar: 0.08, soleType: "runner", toeSpring: 17, toeWidth: 0.92, toeHeight: 0.95, toeRound: 0.32, width: 0.98, soleFlare: 1.5 } },
];

export const SOLE_TYPES: { id: SoleType; de: string; text: string }[] = [
  { id: "cupsole", de: "Cupsole", text: "Gummi-Wanne, angeklebt und vernäht. Court-Schuhe." },
  { id: "vulc", de: "Vulkanisiert", text: "Flach und flexibel, mit Gummi-Zehenkappe. Skate- und Canvas-Schuhe." },
  { id: "chunky", de: "Chunky", text: "Hohe, ausgestellte Sohle mit geschwungener Linie. Eigene Gussform nötig." },
  { id: "runner", de: "Runner", text: "EVA-Keil, vorne dünner. Geklebte Bauweise." },
];

/* ------------------------------------------------------------------ */
/* Wunsch-Assistent (regelbasiert, ohne KI)                            */
/* ------------------------------------------------------------------ */

export interface WishResult {
  shape: Partial<ShapeParams>;
  soleH?: number;
  colors: { parts: PartId[]; c: string }[];
  materials: { parts: PartId[]; m: MaterialId }[];
  understood: string[];
}

const COLOR_WORDS: [string, string][] = [
  ["off-white", "#F2EEE6"], ["offwhite", "#F2EEE6"], ["weiss", "#F2EEE6"], ["weiß", "#F2EEE6"], ["creme", "#EAE3D4"], ["beige", "#C9B28A"], ["sand", "#C9B28A"],
  ["gummibraun", "#A86F3A"], ["gum", "#A86F3A"], ["mokka", "#6B4C3B"], ["espresso", "#3B2A22"], ["braun", "#6B4C3B"], ["tan", "#A9875B"],
  ["salbei", "#9BAA86"], ["oliv", "#6E7D5C"], ["waldgrün", "#2F5640"], ["grün", "#2F5640"], ["dunkelblau", "#283149"], ["navy", "#283149"], ["blau", "#3F5F8A"],
  ["hellgrau", "#B9BBBD"], ["beton", "#B9BBBD"], ["anthrazit", "#2A2B2E"], ["grau", "#8E9195"], ["schwarz", "#1A1B1C"],
  ["terracotta", "#C2643F"], ["rost", "#B6452C"], ["rot", "#B6452C"], ["orange", "#D2733A"], ["senf", "#D9B44A"], ["gelb", "#D9B44A"], ["rosa", "#D9A6A0"], ["lila", "#6D5A7E"],
];
const MAT_WORDS: [string, MaterialId][] = [["wildleder", "suede"], ["suede", "suede"], ["nubuk", "nubuck"], ["glattleder", "leather"], ["leder", "leather"], ["canvas", "canvas"], ["mesh", "mesh"], ["strick", "knit"], ["knit", "knit"], ["ripstop", "ripstop"]];
const PART_WORDS: [string, PartId[]][] = [
  ["fersenlasche", ["heeltab"]], ["ferse", ["heel", "heeltab"]], ["zehenkappe", ["toecap"]], ["spitze", ["toecap"]], ["vorderblatt", ["vamp"]],
  ["seitenband", ["mudguard"]], ["seitenteil", ["quarter"]], ["ösenleiste", ["eyestay"]], ["zunge", ["tongue"]], ["futter", ["lining"]], ["kragen", ["lining"]],
  ["logo", ["badge"]], ["schnürsenkel", ["laces"]], ["senkel", ["laces"]], ["zwischensohle", ["midsole"]], ["laufsohle", ["outsole"]], ["sohle", ["midsole", "outsole"]],
];
const UPPER: PartId[] = ["quarter", "vamp", "toecap", "mudguard", "heel", "heeltab", "eyestay", "tongue"];

/**
 * Versteht einfache Beschreibungen wie
 * «hoher Basketball-Schuh, dicke Sohle, schmale Spitze, Wildleder in Oliv, Sohle gummibraun».
 * Satzteile werden an Kommas, «und» und «mit» getrennt; Farbe und Material gelten für das genannte Teil.
 */
export function interpretWish(text: string): WishResult {
  const t = text.toLowerCase();
  const r: WishResult = { shape: {}, colors: [], materials: [], understood: [] };
  const has = (...w: string[]) => w.some((x) => t.includes(x));

  // Silhouette
  if (has("high", "hoch", "basketball", "knöchel")) { r.shape.collar = 1; r.understood.push("High-Top"); }
  else if (has("mid")) { r.shape.collar = 0.5; r.understood.push("Mid-Top"); }
  else if (has("low", "niedrig", "flach geschnitten")) { r.shape.collar = 0; r.understood.push("Low-Top"); }

  // Sohle
  if (has("chunky", "plateau", "massiv", "dicke sohle", "hohe sohle", "fette sohle")) { r.shape.soleType = "chunky"; r.shape.soleFlare = 3; r.soleH = 52; r.understood.push("Chunky-Sohle"); }
  else if (has("skate", "vulkan", "vulc")) { r.shape.soleType = "vulc"; r.soleH = 22; r.shape.toeSpring = 6; r.understood.push("vulkanisierte Sohle"); }
  else if (has("runner", "lauf", "jogg", "retro run")) { r.shape.soleType = "runner"; r.soleH = 36; r.shape.toeSpring = 17; r.understood.push("Runner-Sohle"); }
  else if (has("court", "cupsole", "tennis")) { r.shape.soleType = "cupsole"; r.understood.push("Cupsole"); }
  if (has("dünne sohle", "flache sohle")) { r.soleH = r.shape.soleType === "vulc" ? 20 : 27; r.understood.push("dünne Sohle"); }

  // Spitze und Breite
  if (has("schmal", "spitz", "elegant", "slim")) { r.shape.toeWidth = 0.9; r.shape.toeRound = 0.35; r.shape.toeHeight = 0.92; r.understood.push("schmale Spitze"); }
  if (has("breit", "rund", "bulky", "klobig")) { r.shape.toeWidth = 1.1; r.shape.toeRound = 0.75; r.shape.toeHeight = 1.08; r.understood.push("breite, runde Spitze"); }
  if (has("zehenhub", "nach oben gebogen")) { r.shape.toeSpring = 18; r.understood.push("mehr Zehenhub"); }

  // Konstruktion
  if (has("t-toe", "t toe", "terrace")) { r.shape.toecapStyle = "ttoe"; r.shape.mudguardHeight = 0; r.understood.push("T-Toe"); }
  if (has("shell toe", "shelltoe", "gummikappe")) { r.shape.shellToe = 1; r.shape.toecapStyle = "none"; r.understood.push("Shell Toe aus Gummi"); }
  if (has("ohne zehenkappe", "clean", "minimal", "nahtlos")) { r.shape.toecapStyle = "none"; r.shape.mudguardHeight = 0; r.understood.push("ohne Overlays vorne"); }
  if (has("ollie", "hohes seitenband", "viele overlays", "panel")) { r.shape.mudguardHeight = 0.85; r.shape.eyestayWidth = 0.2; r.understood.push("hohes Seitenband"); }
  if (has("dicke zunge", "puffy", "gepolsterte zunge")) { r.shape.tongueHeight = 14; r.understood.push("dicke Zunge"); }
  if (has("breite senkel", "breite schnürsenkel", "fette senkel")) { r.shape.laceWidth = 14; r.understood.push("breite Senkel"); }
  if (has("mohair")) { r.materials.push({ parts: ["laces"], m: "mohair" }); r.understood.push("Mohair-Senkel"); }
  if (has("genarbt", "pebble")) { r.materials.push({ parts: ["toecap", "mudguard", "heel"], m: "pebble" }); r.understood.push("genarbtes Leder"); }

  // Farben und Materialien pro Satzteil
  const clauses = t.split(/,|;| und | mit |\./).map((c) => c.trim()).filter(Boolean);
  for (const c of clauses) {
    const part = PART_WORDS.find(([w]) => c.includes(w));
    const col = COLOR_WORDS.find(([w]) => c.includes(w));
    const mat = MAT_WORDS.find(([w]) => c.includes(w));
    if (!col && !mat) continue;
    const ids = part ? part[1] : UPPER;
    const target = part ? part[0] : "Obermaterial";
    if (col) { r.colors.push({ parts: ids, c: col[1] }); r.understood.push(`${target}: ${col[0]}`); }
    if (mat && ids.every((id) => !["midsole", "outsole", "laces"].includes(id))) { r.materials.push({ parts: ids, m: mat[1] }); r.understood.push(`${target}: ${mat[0]}`); }
  }
  return r;
}

export const PALETTE_NAMES = Object.fromEntries(PALETTE.map(([n, h]) => [h.toLowerCase(), n]));

/* ------------------------------------------------------------------ */
/* Stilrichtungen                                                      */
/* ------------------------------------------------------------------ */

type PartMap = Record<PartId, [string, MaterialId]>;

export interface StylePreset {
  id: string;
  name: string;
  /** Woher die Stilrichtung kommt (Genre, keine Kopie) */
  inspired: string;
  text: string;
  shape: Partial<ShapeParams>;
  soleH: number;
  parts: PartMap;
  perforation?: boolean;
}

/**
 * Stilrichtungen, inspiriert von bekannten Genres und Designer-Labels.
 * Bewusst ohne Logos, Streifen, Muster oder andere geschützte Erkennungsmerkmale.
 */
export const STYLES: StylePreset[] = [
  {
    id: "terrace", name: "Terrace Low", inspired: "Terrace-Stil der Fussballkultur (z. B. Samba, Gazelle, Palermo)",
    text: "Flach, schmal und lang, mit T-Toe, Wildleder-Overlays und dünner Gummisohle.",
    soleH: 24,
    shape: { collar: 0, soleType: "cupsole", toeSpring: 8, toeWidth: 0.88, toeHeight: 0.84, toeRound: 0.28, width: 0.95, soleFlare: 0, toecapStyle: "ttoe", toecapLength: 0.5, mudguardHeight: 0, heelCounter: 0.9, eyestayWidth: 0.12, eyelets: 7, tongueHeight: 6, collarDip: 0.8, shellToe: 0, laceWidth: 6 },
    parts: { quarter: ["#F2EEE6", "leather"], vamp: ["#F2EEE6", "leather"], toecap: ["#3B2A22", "suede"], mudguard: ["#3B2A22", "suede"], heel: ["#3B2A22", "suede"], heeltab: ["#3B2A22", "suede"], eyestay: ["#F2EEE6", "leather"], tongue: ["#1A1B1C", "leather"], lining: ["#F2EEE6", "leather"], badge: ["#D9B44A", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#A86F3A", "rubber"], outsole: ["#A86F3A", "rubber"] },
  },
  {
    id: "court-classic", name: "Court Classic", inspired: "Basketball-Court-Klassiker der 80er (z. B. AF1, Superstar)",
    text: "Breite, runde Spitze, kräftige Cupsole, perforierte Zehenkappe, ganz in Weiss.",
    soleH: 36, perforation: true,
    shape: { collar: 0, soleType: "cupsole", toeSpring: 10, toeWidth: 1.08, toeHeight: 1.08, toeRound: 0.72, width: 1.04, soleFlare: 1, toecapStyle: "cap", toecapLength: 0.55, mudguardHeight: 0.42, heelCounter: 1.2, eyestayWidth: 0.16, eyelets: 0, tongueHeight: 4, collarDip: 1.1, shellToe: 0, laceWidth: 7 },
    parts: { quarter: ["#F4F3EF", "leather"], vamp: ["#F4F3EF", "leather"], toecap: ["#F4F3EF", "leather"], mudguard: ["#F4F3EF", "leather"], heel: ["#F4F3EF", "leather"], heeltab: ["#F4F3EF", "leather"], eyestay: ["#F4F3EF", "leather"], tongue: ["#F4F3EF", "leather"], lining: ["#F4F3EF", "mesh"], badge: ["#E8E6E0", "leather"], laces: ["#F4F3EF", "cotton"], midsole: ["#F6F5F1", "rubber"], outsole: ["#F6F5F1", "rubber"] },
  },
  {
    id: "skate-panel", name: "Skate Panel Low", inspired: "Skate- und Panel-Lows (z. B. Dunk Low, Dior B27)",
    text: "Viele Overlays, hohes Seitenband als Ollie-Guard, gepolsterte Zunge, weisse Mittelsohle auf Gummi.",
    soleH: 32,
    shape: { collar: 0.05, soleType: "cupsole", toeSpring: 11, toeWidth: 1.04, toeHeight: 1.02, toeRound: 0.62, width: 1.02, soleFlare: 0.5, toecapStyle: "cap", toecapLength: 0.62, mudguardHeight: 0.85, heelCounter: 1.3, eyestayWidth: 0.2, eyelets: 0, tongueHeight: 12, collarDip: 1.2, shellToe: 0, laceWidth: 8 },
    parts: { quarter: ["#F2EEE6", "leather"], vamp: ["#F2EEE6", "leather"], toecap: ["#2F5640", "suede"], mudguard: ["#2F5640", "suede"], heel: ["#2F5640", "suede"], heeltab: ["#2F5640", "suede"], eyestay: ["#2F5640", "suede"], tongue: ["#F2EEE6", "ripstop"], lining: ["#F2EEE6", "mesh"], badge: ["#F2EEE6", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#F3EDE1", "rubber"], outsole: ["#A86F3A", "rubber"] },
  },
  {
    id: "retro-hoop", name: "Retro Hoop High", inspired: "Basketball-High-Tops der 80er (z. B. Jordan 1)",
    text: "Hoher Schaft, klare Overlays, lange Schnürung, flache und kräftige Mittelsohle.",
    soleH: 30, perforation: true,
    shape: { collar: 1, soleType: "cupsole", toeSpring: 11, toeWidth: 0.98, toeHeight: 0.98, toeRound: 0.5, width: 1, soleFlare: 0, toecapStyle: "cap", toecapLength: 0.55, mudguardHeight: 0.55, heelCounter: 1.25, eyestayWidth: 0.17, eyelets: 9, tongueHeight: 8, collarDip: 1, shellToe: 0, laceWidth: 7 },
    parts: { quarter: ["#F2EEE6", "leather"], vamp: ["#F2EEE6", "leather"], toecap: ["#B6452C", "leather"], mudguard: ["#B6452C", "leather"], heel: ["#B6452C", "leather"], heeltab: ["#1A1B1C", "leather"], eyestay: ["#B6452C", "leather"], tongue: ["#F2EEE6", "ripstop"], lining: ["#1A1B1C", "mesh"], badge: ["#1A1B1C", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#F3EDE1", "rubber"], outsole: ["#B6452C", "rubber"] },
  },
  {
    id: "luxe-high", name: "Luxe High", inspired: "Luxus-High-Tops von Designerhäusern (z. B. Dior B23)",
    text: "Hoher, ruhiger Schaft mit wenigen Teilen, Gummisohle mit verstärkter Spitze.",
    soleH: 28,
    shape: { collar: 1, soleType: "vulc", toeSpring: 8, toeWidth: 1.02, toeHeight: 0.98, toeRound: 0.7, width: 1, soleFlare: 0, toecapStyle: "none", toecapLength: 0.5, mudguardHeight: 0, heelCounter: 0.8, eyestayWidth: 0.13, eyelets: 9, tongueHeight: 4, collarDip: 0.6, shellToe: 0.15, laceWidth: 7 },
    parts: { quarter: ["#F2EEE6", "canvas"], vamp: ["#F2EEE6", "canvas"], toecap: ["#F2EEE6", "canvas"], mudguard: ["#F2EEE6", "canvas"], heel: ["#1A1B1C", "leather"], heeltab: ["#1A1B1C", "leather"], eyestay: ["#1A1B1C", "leather"], tongue: ["#F2EEE6", "canvas"], lining: ["#1A1B1C", "leather"], badge: ["#1A1B1C", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#F2EEE6", "rubber"], outsole: ["#C9B28A", "rubber"] },
  },
  {
    id: "luxe-runner", name: "Luxe Runner", inspired: "Designer-Runner mit skulpturaler Sohle (z. B. Dior B30)",
    text: "Ausgestellte Keilsohle in zwei Tönen, Mesh mit Wildleder-Overlays, hohes Seitenband.",
    soleH: 40,
    shape: { collar: 0.12, soleType: "runner", toeSpring: 16, toeWidth: 0.95, toeHeight: 0.98, toeRound: 0.42, width: 1, soleFlare: 3.5, toecapStyle: "cap", toecapLength: 0.4, mudguardHeight: 0.7, heelCounter: 1.25, eyestayWidth: 0.18, eyelets: 7, tongueHeight: 6, collarDip: 1.2, shellToe: 0, laceWidth: 6 },
    parts: { quarter: ["#5C6B7A", "mesh"], vamp: ["#5C6B7A", "mesh"], toecap: ["#2A2B2E", "suede"], mudguard: ["#2A2B2E", "suede"], heel: ["#2A2B2E", "suede"], heeltab: ["#B9BBBD", "ripstop"], eyestay: ["#2A2B2E", "suede"], tongue: ["#5C6B7A", "mesh"], lining: ["#2A2B2E", "knit"], badge: ["#B9BBBD", "leather"], laces: ["#2A2B2E", "cotton"], midsole: ["#ECEAE5", "eva"], outsole: ["#2A2B2E", "rubber"] },
  },
  {
    id: "shell-toe-luxe", name: "Shell Toe Luxe", inspired: "Street-Luxe mit Gummi-Shell-Toe (z. B. Numeris Eclipse)",
    text: "Reduzierte Basketball-Form der 60er mit skulpturaler Gummikappe über der Spitze, Wildleder und Leder, breite Mohair-Senkel.",
    soleH: 30,
    shape: { collar: 0.05, soleType: "cupsole", toeSpring: 9, toeWidth: 1.02, toeHeight: 0.98, toeRound: 0.62, width: 1, soleFlare: 0.5, toecapStyle: "none", toecapLength: 0.5, mudguardHeight: 0.3, heelCounter: 1.1, eyestayWidth: 0.15, eyelets: 6, tongueHeight: 8, collarDip: 0.9, shellToe: 1, laceWidth: 10 },
    parts: { quarter: ["#1A1B1C", "suede"], vamp: ["#1A1B1C", "suede"], toecap: ["#1A1B1C", "suede"], mudguard: ["#1A1B1C", "leather"], heel: ["#1A1B1C", "leather"], heeltab: ["#1A1B1C", "leather"], eyestay: ["#1A1B1C", "leather"], tongue: ["#1A1B1C", "suede"], lining: ["#2A2B2E", "leather"], badge: ["#2A2B2E", "leather"], laces: ["#1A1B1C", "mohair"], midsole: ["#2A2B2E", "rubber"], outsole: ["#1A1B1C", "rubber"] },
  },
  {
    id: "atelier-chunky", name: "Atelier Chunky", inspired: "Pariser Street-Luxe auf Chunky-Sohle (z. B. Numeris Atelier)",
    text: "Kräftige Sohle, Zehenkappe aus genarbtem Leder, extra breite flache Senkel.",
    soleH: 44,
    shape: { collar: 0.05, soleType: "chunky", toeSpring: 12, toeWidth: 1.06, toeHeight: 1.06, toeRound: 0.66, width: 1.03, soleFlare: 2, toecapStyle: "cap", toecapLength: 0.6, mudguardHeight: 0.35, heelCounter: 1.1, eyestayWidth: 0.17, eyelets: 6, tongueHeight: 8, collarDip: 1, shellToe: 0, laceWidth: 14 },
    parts: { quarter: ["#E6D9D6", "leather"], vamp: ["#E6D9D6", "leather"], toecap: ["#D9A6A0", "pebble"], mudguard: ["#D9A6A0", "pebble"], heel: ["#D9A6A0", "pebble"], heeltab: ["#D9A6A0", "pebble"], eyestay: ["#E6D9D6", "leather"], tongue: ["#E6D9D6", "leather"], lining: ["#F2EEE6", "leather"], badge: ["#D9A6A0", "leather"], laces: ["#E6D9D6", "cotton"], midsole: ["#F3EDE1", "rubber"], outsole: ["#F3EDE1", "rubber"] },
  },
  {
    id: "campus-chunky-suede", name: "Chunky Suede Low", inspired: "Kräftige Wildleder-Lows der 80er (z. B. Campus)",
    text: "Breiter, kräftiger Wildleder-Schuh mit dicker Zunge und heller Cupsole.",
    soleH: 32,
    shape: { collar: 0, soleType: "cupsole", toeSpring: 10, toeWidth: 1.06, toeHeight: 1.06, toeRound: 0.7, width: 1.05, soleFlare: 1, toecapStyle: "cap", toecapLength: 0.5, mudguardHeight: 0, heelCounter: 1, eyestayWidth: 0.16, eyelets: 7, tongueHeight: 10, collarDip: 1, shellToe: 0, laceWidth: 7 },
    parts: { quarter: ["#5C6B7A", "suede"], vamp: ["#5C6B7A", "suede"], toecap: ["#5C6B7A", "suede"], mudguard: ["#5C6B7A", "suede"], heel: ["#5C6B7A", "suede"], heeltab: ["#5C6B7A", "suede"], eyestay: ["#5C6B7A", "suede"], tongue: ["#5C6B7A", "suede"], lining: ["#F2EEE6", "leather"], badge: ["#F2EEE6", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#F3EDE1", "rubber"], outsole: ["#F3EDE1", "rubber"] },
  },
  {
    id: "designer-minimal", name: "Designer Minimal", inspired: "Minimalistische Luxus-Sneaker aus Italien",
    text: "Fast nahtlos, ohne Overlays, schlanke Spitze, dünne vernähte Sohle, kleiner Patch.",
    soleH: 26,
    shape: { collar: 0, soleType: "cupsole", toeSpring: 9, toeWidth: 0.92, toeHeight: 0.9, toeRound: 0.45, width: 0.97, soleFlare: 0, toecapStyle: "none", toecapLength: 0.5, mudguardHeight: 0, heelCounter: 0.65, eyestayWidth: 0.11, eyelets: 6, tongueHeight: 2, collarDip: 0.9, shellToe: 0, laceWidth: 6 },
    parts: { quarter: ["#F4F3EF", "leather"], vamp: ["#F4F3EF", "leather"], toecap: ["#F4F3EF", "leather"], mudguard: ["#F4F3EF", "leather"], heel: ["#F4F3EF", "leather"], heeltab: ["#F4F3EF", "leather"], eyestay: ["#F4F3EF", "leather"], tongue: ["#F4F3EF", "leather"], lining: ["#EAE3D4", "leather"], badge: ["#D9B44A", "leather"], laces: ["#F4F3EF", "cotton"], midsole: ["#F6F5F1", "rubber"], outsole: ["#F6F5F1", "rubber"] },
  },
];

/* ------------------------------------------------------------------ */
/* Meine Modelle (lokal gespeichert, exportierbar)                     */
/* ------------------------------------------------------------------ */

export interface MyModel {
  id: string;
  name: string;
  shape: Partial<ShapeParams>;
  soleH: number;
  createdAt: number;
}

const MY_KEY = "sole-studio.my-models.v1";

export function readMyModels(): MyModel[] {
  try {
    const raw = localStorage.getItem(MY_KEY);
    return raw ? (JSON.parse(raw) as MyModel[]) : [];
  } catch {
    return [];
  }
}

export function writeMyModels(list: MyModel[]): boolean {
  try {
    localStorage.setItem(MY_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Prüft eine importierte Datei und gibt gültige Modelle zurück */
export function parseModelFile(text: string): MyModel[] {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : Array.isArray(data?.models) ? data.models : [data];
  return arr
    .filter((m: unknown): m is MyModel => !!m && typeof (m as MyModel).name === "string" && typeof (m as MyModel).soleH === "number" && typeof (m as MyModel).shape === "object")
    .map((m: MyModel) => ({ ...m, id: Math.random().toString(36).slice(2, 10), createdAt: Date.now() }));
}

/** Ob ein Teil in der aktuellen Konstruktion überhaupt vorkommt */
export function partExists(shape: Partial<ShapeParams> | undefined, id: PartId): boolean {
  const s = shape ?? {};
  if (id === "toecap") return (s.toecapStyle ?? "cap") !== "none";
  if (id === "mudguard") return (s.mudguardHeight ?? 0.4) > 0.03;
  if (id === "heel") return (s.heelCounter ?? 1) > 0.3;
  return true;
}
