/**
 * Baut die Beschreibung für das KI-Foto-Rendering aus dem Design-Rezept.
 * Ziel: das Bildmodell soll den Entwurf fotorealistisch darstellen, ohne Form, Aufteilung oder Farben zu verändern.
 */
import { DEFAULT_SHAPE } from "../shoe/geometry";
import { MATERIALS, PALETTE } from "../shoe/catalog";
import { partExists } from "../shoe/models";
import type { Design, MaterialId, PartId } from "../shoe/types";

export type RenderScene = "studio" | "street" | "concrete" | "flatlay" | "box" | "onfoot";

export const RENDER_SCENES: { id: RenderScene; de: string; text: string }[] = [
  { id: "studio", de: "Studio", text: "Produktfoto auf hellgrauem, nahtlosem Hintergrund" },
  { id: "street", de: "Strasse", text: "Auf Asphalt in der Stadt, warmes Abendlicht" },
  { id: "concrete", de: "Beton", text: "Auf rohem Betonblock, weiches Tageslicht" },
  { id: "flatlay", de: "Flat-Lay", text: "Von oben auf Papier, wie im Lookbook" },
  { id: "box", de: "Mit Schachtel", text: "Neben offener Schuhschachtel mit Seidenpapier" },
  { id: "onfoot", de: "Am Fuss", text: "Getragen, mit Hose, Ausschnitt ab Knie" },
];

const SCENE_TEXT: Record<RenderScene, string> = {
  studio: "Professional e-commerce studio product photograph on a seamless light grey backdrop, large softbox key light from the upper left, subtle rim light, soft natural contact shadow under the sole.",
  street: "Editorial streetwear photograph: the sneaker stands on dark city asphalt with a softly blurred urban background, warm golden-hour sunlight, shallow depth of field.",
  concrete: "Minimal lifestyle photograph: the sneaker stands on a raw grey concrete block, soft diffuse daylight from a large window, calm architectural mood.",
  flatlay: "Top-down flat-lay photograph of the sneaker lying on textured off-white paper, soft even light, a few subtle props at the edges (folded tissue paper), lookbook style.",
  box: "Product photograph of the sneaker placed next to an open plain cardboard shoe box with white tissue paper, soft studio light, premium unboxing mood. The box has no logos.",
  onfoot: "On-foot lifestyle photograph, cropped from the knee down, the sneaker worn with relaxed straight-leg trousers, standing on a city pavement, natural daylight.",
};

const MAT_EN: Record<MaterialId, string> = {
  leather: "smooth full-grain leather with fine natural grain",
  pebble: "pebbled tumbled leather with a pronounced grain",
  suede: "soft suede with a visible velvety nap",
  nubuck: "fine nubuck leather with a dense matte nap",
  canvas: "cotton canvas with a visible weave",
  mesh: "breathable engineered mesh",
  knit: "soft knit textile",
  ripstop: "technical ripstop nylon",
  cotton: "flat cotton laces",
  mohair: "fuzzy mohair laces",
  rubber: "rubber",
  eva: "matte EVA foam",
};

const PART_EN: Record<PartId, string> = {
  quarter: "rear side panels (quarters)",
  vamp: "front base panel (vamp)",
  toecap: "toe cap overlay",
  mudguard: "lower side overlay (mudguard)",
  heel: "heel counter overlay",
  heeltab: "heel tab",
  eyestay: "eyestay (lace panel with eyelets)",
  tongue: "tongue",
  lining: "lining and padded collar",
  badge: "small side patch",
  laces: "laces",
  midsole: "midsole sidewall",
  outsole: "outsole",
};

const NAMES = Object.fromEntries(PALETTE.map(([n, h]) => [h.toLowerCase(), n]));

function colorName(hex: string) {
  const n = NAMES[hex.toLowerCase()];
  return n ? `${n.toLowerCase()} (${hex.toUpperCase()})` : hex.toUpperCase();
}

export function buildRenderPrompt(d: Design, scene: RenderScene, extra: string): string {
  const s = { ...DEFAULT_SHAPE, ...d.shape };
  const height = s.collar > 1.05 ? "lace-up boot" : s.collar >= 0.75 ? "high-top sneaker" : s.collar >= 0.25 ? "mid-top sneaker" : "low-top sneaker";
  const sole = {
    cupsole: `a stitched rubber cupsole about ${d.soleH} mm high`,
    vulc: `a flat vulcanized rubber sole about ${d.soleH} mm high with foxing tape`,
    chunky: `a chunky sculpted platform sole about ${d.soleH} mm high`,
    runner: `a sculpted running wedge sole about ${d.soleH} mm high at the heel, thinner at the toe`,
    lug: `a rugged lug outsole with a stitched welt, about ${d.soleH} mm high`,
  }[s.soleType];

  const lines: string[] = [];
  for (const id of Object.keys(PART_EN) as PartId[]) {
    if (!partExists(d.shape, id)) continue;
    const p = d.parts[id];
    lines.push(`- ${PART_EN[id]}: ${colorName(p.c)} ${MAT_EN[p.m] ?? MATERIALS[p.m].en}`);
  }

  const details: string[] = [];
  if (s.toecapStyle === "ttoe") details.push("a T-shaped toe overlay running from the toe cap up to the laces");
  if (s.toecapStyle === "none") details.push("no separate toe cap overlay");
  if (s.shellToe > 0.3) details.push("a sculpted rubber shell toe that wraps over the front of the toe");
  if (s.tongueSplit) details.push("a split tongue made of two halves");
  if (s.tongueHeight > 9) details.push("a thick padded tongue");
  if (s.mudguardHeight > 0.75) details.push("a tall mudguard overlay like a skate ollie guard");
  if (d.details?.perforation) details.push("perforations on the toe cap");
  details.push(d.details?.doubleStitch === false ? "single-needle stitching" : "neat double-needle stitching on the overlays");
  details.push(`${Math.round(s.laceWidth)} mm wide laces`);

  const logo = (d.details?.logoText ?? "SOLE").toUpperCase();

  return [
    "Turn the attached 3D design render into a photorealistic photograph of the same sneaker.",
    "Keep the exact design: same silhouette, proportions, panel layout and seam lines, the same colors and materials for every part, the same number of eyelets, the same sole shape. Do not redesign, do not add or remove panels.",
    `Shoe: ${height} with ${sole}.`,
    "Parts and materials:",
    ...lines,
    `Details: ${details.join("; ")}.`,
    `Branding: only the small side patch shows the word "${logo}". No other logos, stripes, swooshes, stars, monograms or text anywhere.`,
    "Realism: real material behaviour, subtle natural leather creasing at the flex point, slightly padded edges, visible stitching, fine texture of each material, realistic reflections on rubber.",
    SCENE_TEXT[scene],
    "High-end product photography, 85 mm lens, sharp focus on the shoe, true-to-life colors, no illustration or CGI look.",
    extra.trim() ? `Additional wishes: ${extra.trim()}` : "",
  ].filter(Boolean).join("\n");
}
