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
