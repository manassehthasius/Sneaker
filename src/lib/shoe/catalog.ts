import type { Design, MaterialId, PartId, PartKind, PartStyle } from "./types";

export interface PartInfo {
  id: PartId;
  de: string;
  en: string;
  kind: PartKind;
  /** Wozu das Teil da ist */
  info: string;
  /** Wie es gebaut wird */
  build: string;
  /** Gestaltungstipp */
  tip: string;
}

export const PARTS: PartInfo[] = [
  { id: "quarter", de: "Seitenteil", en: "Quarter", kind: "upper", info: "Das grosse Seitenteil hinten. Es trägt die Ösenleiste und gibt seitlich Halt.", build: "Grundteil aus einem Stück, ca. 1,4 mm Leder. Wird an das Vorderblatt genäht.", tip: "Meist die Hauptfarbe. Grosse Fläche, also ruhig halten." },
  { id: "vamp", de: "Vorderblatt", en: "Vamp", kind: "upper", info: "Bedeckt den Vorderfuss bis zur Schnürung. Hier knickt der Schuh beim Gehen.", build: "Grundteil, an der Seitennaht mit dem Seitenteil verbunden.", tip: "Weiches Material knickt schöner als steifes." },
  { id: "toecap", de: "Zehenkappe", en: "Toe Cap", kind: "upper", info: "Die Spitze des Schuhs. Schützt die Zehen und nimmt viel Abrieb auf.", build: "Overlay, aufgenäht. Darunter sitzt eine unsichtbare Vorderkappe (Toe Puff), die die Form hält.", tip: "Wildleder in einer Zweitfarbe ist ein Casual-Klassiker." },
  { id: "mudguard", de: "Seitenband", en: "Mudguard", kind: "upper", info: "Band rund um den unteren Rand. Schützt vor Schmutz und Abrieb.", build: "Overlay, aufgenäht. Verläuft oft rund um die Ferse.", tip: "Gut für die Zweitfarbe. Es erdet den Schuh optisch." },
  { id: "heel", de: "Fersenkappe", en: "Heel Counter", kind: "upper", info: "Stabilisiert die Ferse.", build: "Overlay, aufgenäht. Darunter sitzt eine feste Hinterkappe (Counter) aus Kunststoff oder Leder.", tip: "Ein dunklerer Ton hinten wirkt dynamischer." },
  { id: "heeltab", de: "Fersenlasche", en: "Heel Tab", kind: "upper", info: "Die kleine Lasche oben an der Ferse, oft mit Logo.", build: "Doppelt gelegt und über die Fersennaht genäht.", tip: "Perfekte Stelle für deine Akzentfarbe." },
  { id: "eyestay", de: "Ösenleiste", en: "Eyestay", kind: "upper", info: "Verstärkter Streifen mit den Ösen für die Schnürsenkel.", build: "Overlay mit Verstärkung darunter. Ösen werden gestanzt und vernietet.", tip: "In Kontrastfarbe betont sie die Linie vom Kragen zur Spitze." },
  { id: "tongue", de: "Zunge", en: "Tongue", kind: "upper", info: "Liegt unter der Schnürung und polstert den Fussrücken.", build: "Zwei Lagen mit Schaumpolster dazwischen, vorne am Vorderblatt angenäht.", tip: "Mesh oder Ripstop an der Zunge wirkt sportlich und leicht." },
  { id: "lining", de: "Futter und Kragen", en: "Lining & Collar", kind: "upper", info: "Innenfutter und gepolsterter Rand am Einstieg.", build: "Wird am Kragen mit dem Obermaterial vernäht, dazwischen liegt Schaum.", tip: "Eine überraschende Futterfarbe ist ein Detail für den zweiten Blick." },
  { id: "badge", de: "Logo-Patch", en: "Logo Patch", kind: "upper", info: "Platz für dein Markenlogo.", build: "Aufgenäht, geprägt oder gestickt, bevor der Schaft geschlossen wird.", tip: "Klein und dezent wirkt casual." },
  { id: "laces", de: "Schnürsenkel", en: "Laces", kind: "laces", info: "Flach oder rund, aus Baumwolle oder Polyester.", build: "Werden ganz am Schluss eingezogen.", tip: "Meist in der Hauptfarbe oder Off-White." },
  { id: "midsole", de: "Zwischensohle", en: "Midsole", kind: "sole", info: "Der sichtbare Sohlenrand. Bestimmt Höhe und Dämpfung.", build: "Bei der Cupsole: Gummi-Wanne, angeklebt und rundum vernäht.", tip: "Cremeweiss wirkt vintage, Reinweiss clean." },
  { id: "outsole", de: "Laufsohle", en: "Outsole", kind: "sole", info: "Der Teil mit Bodenkontakt und Profil.", build: "Gummi mit Profil, bei der Cupsole aus einem Stück mit dem Rand.", tip: "Gummibraun («Gum») ist der Casual-Klassiker." },
];

export const PART: Record<PartId, PartInfo> = Object.fromEntries(PARTS.map((p) => [p.id, p])) as Record<PartId, PartInfo>;

export interface MaterialInfo {
  id: MaterialId;
  de: string;
  en: string;
}

export const MATERIALS: Record<MaterialId, MaterialInfo> = {
  leather: { id: "leather", de: "Glattleder", en: "Smooth Leather" },
  suede: { id: "suede", de: "Wildleder", en: "Suede" },
  nubuck: { id: "nubuck", de: "Nubuk", en: "Nubuck" },
  canvas: { id: "canvas", de: "Canvas", en: "Canvas" },
  mesh: { id: "mesh", de: "Mesh", en: "Mesh" },
  knit: { id: "knit", de: "Strick", en: "Knit" },
  ripstop: { id: "ripstop", de: "Ripstop", en: "Ripstop" },
  cotton: { id: "cotton", de: "Baumwolle", en: "Cotton" },
  rubber: { id: "rubber", de: "Gummi", en: "Rubber" },
  eva: { id: "eva", de: "EVA-Schaum", en: "EVA Foam" },
};

export const MATERIALS_FOR: Record<PartKind, MaterialId[]> = {
  upper: ["leather", "suede", "nubuck", "canvas", "mesh", "knit", "ripstop"],
  laces: ["cotton"],
  sole: ["rubber", "eva"],
};

export const PALETTE: [string, string][] = [
  ["Off-White", "#F2EEE6"], ["Creme", "#EAE3D4"], ["Sand", "#C9B28A"], ["Tan", "#A9875B"], ["Mokka", "#6B4C3B"], ["Espresso", "#3B2A22"],
  ["Salbei", "#9BAA86"], ["Oliv", "#6E7D5C"], ["Waldgrün", "#2F5640"], ["Navy", "#283149"], ["Schiefer", "#5C6B7A"], ["Beton", "#B9BBBD"],
  ["Anthrazit", "#2A2B2E"], ["Schwarz", "#1A1B1C"], ["Terracotta", "#C2643F"], ["Rost", "#B6452C"], ["Senf", "#D9B44A"], ["Gum", "#A86F3A"],
];

type Map13 = Record<PartId, [string, MaterialId]>;
function D(soleH: number, map: Map13, shape?: Design["shape"]): Design {
  const parts = {} as Record<PartId, PartStyle>;
  (Object.keys(map) as PartId[]).forEach((id) => (parts[id] = { c: map[id][0], m: map[id][1] }));
  return shape ? { soleH, parts, shape } : { soleH, parts };
}

export interface Template {
  name: string;
  tag: string;
  mood: string;
  why: string;
  design: Design;
}

export const TEMPLATES: Template[] = [
  { name: "Sand Dune", tag: "Ton-in-Ton", mood: "Warme Sandtöne, Glattleder trifft Wildleder.", why: "Drei Abstufungen einer Farbe und eine Gummisohle als warmer Rahmen.",
    design: D(32, { quarter: ["#EAE3D4", "leather"], vamp: ["#EAE3D4", "leather"], toecap: ["#C9B28A", "suede"], mudguard: ["#C9B28A", "suede"], heel: ["#A9875B", "suede"], heeltab: ["#A9875B", "suede"], eyestay: ["#C9B28A", "suede"], tongue: ["#EAE3D4", "leather"], lining: ["#D9CBB0", "leather"], badge: ["#A9875B", "leather"], laces: ["#EFE9DC", "cotton"], midsole: ["#F1EADB", "rubber"], outsole: ["#A86F3A", "rubber"] }) },
  { name: "Concrete", tag: "Monochrom", mood: "Urbanes Grau in drei Stufen.", why: "Nubuk und Wildleder geben den Grautönen Tiefe. Der weisse Logo-Patch ist der einzige Akzent.",
    design: D(32, { quarter: ["#B9BBBD", "nubuck"], vamp: ["#B9BBBD", "nubuck"], toecap: ["#8E9195", "suede"], mudguard: ["#8E9195", "suede"], heel: ["#6E7276", "suede"], heeltab: ["#6E7276", "leather"], eyestay: ["#8E9195", "suede"], tongue: ["#B9BBBD", "nubuck"], lining: ["#9DA0A3", "leather"], badge: ["#EDEDED", "leather"], laces: ["#D8D9DA", "cotton"], midsole: ["#ECEAE5", "rubber"], outsole: ["#5C5F63", "rubber"] }) },
  { name: "Off-Duty Navy", tag: "Skate Vulc", mood: "Entspannter Wochenend-Schuh.", why: "Navy-Canvas mit cremefarbenem Leder ist zeitlos. Rost setzt den Akzent.",
    design: D(22, { quarter: ["#283149", "canvas"], vamp: ["#283149", "canvas"], toecap: ["#283149", "canvas"], mudguard: ["#F1ECE0", "leather"], heel: ["#F1ECE0", "leather"], heeltab: ["#B6452C", "leather"], eyestay: ["#F1ECE0", "leather"], tongue: ["#283149", "canvas"], lining: ["#F1ECE0", "leather"], badge: ["#B6452C", "leather"], laces: ["#F1ECE0", "cotton"], midsole: ["#EFE6D2", "rubber"], outsole: ["#283149", "rubber"] }, { soleType: "vulc", toeSpring: 6, toeWidth: 1.02, toeHeight: 0.92, toeRound: 0.72, width: 1.02 }) },
  { name: "Matcha Latte", tag: "Pastell-Erde", mood: "Salbeigrün auf Creme.", why: "Ein gedecktes Grün wirkt frisch, ohne laut zu sein.",
    design: D(32, { quarter: ["#EFE8D9", "leather"], vamp: ["#EFE8D9", "leather"], toecap: ["#9BAA86", "suede"], mudguard: ["#9BAA86", "suede"], heel: ["#9BAA86", "suede"], heeltab: ["#6E7D5C", "suede"], eyestay: ["#9BAA86", "suede"], tongue: ["#EFE8D9", "leather"], lining: ["#CFC4AA", "leather"], badge: ["#6E7D5C", "leather"], laces: ["#EFE8D9", "cotton"], midsole: ["#E9DFC9", "rubber"], outsole: ["#C7B48F", "rubber"] }) },
  { name: "Night Shift", tag: "Blackout High", mood: "Dunkler High-Top, technisch und schlicht.", why: "Bei Schwarz-in-Schwarz tragen die Oberflächen. Die graue Fersenlasche setzt den Kontrast.",
    design: D(32, { quarter: ["#1E1F21", "leather"], vamp: ["#1E1F21", "leather"], toecap: ["#2A2B2E", "suede"], mudguard: ["#2A2B2E", "suede"], heel: ["#2A2B2E", "suede"], heeltab: ["#C9CBCE", "ripstop"], eyestay: ["#2A2B2E", "suede"], tongue: ["#1E1F21", "ripstop"], lining: ["#3A3C40", "leather"], badge: ["#C9CBCE", "leather"], laces: ["#1E1F21", "cotton"], midsole: ["#2B2C2E", "rubber"], outsole: ["#18191A", "rubber"] }, { collar: 1, toeSpring: 12, toeWidth: 1.02, toeHeight: 1.04, toeRound: 0.6, width: 1.02, soleFlare: 0.5 }) },
  { name: "Terracotta Court", tag: "Clean mit Akzent", mood: "Weisser Court-Schuh mit warmem Akzent.", why: "Viel Off-White wirkt clean. Terracotta-Wildleder gibt Wärme.",
    design: D(32, { quarter: ["#F2EEE6", "leather"], vamp: ["#F2EEE6", "leather"], toecap: ["#F2EEE6", "leather"], mudguard: ["#C2643F", "suede"], heel: ["#C2643F", "suede"], heeltab: ["#C2643F", "suede"], eyestay: ["#F2EEE6", "leather"], tongue: ["#F2EEE6", "leather"], lining: ["#E3C9B5", "leather"], badge: ["#C2643F", "leather"], laces: ["#F2EEE6", "cotton"], midsole: ["#F3EDE1", "rubber"], outsole: ["#A86F3A", "rubber"] }) },
  { name: "Vintage Varsity", tag: "Retro", mood: "College-Look der 70er.", why: "Waldgrün und Senf auf Creme. Die vergilbte Sohle verstärkt den Vintage-Charakter.",
    design: D(32, { quarter: ["#EFE7D2", "leather"], vamp: ["#EFE7D2", "leather"], toecap: ["#EFE7D2", "leather"], mudguard: ["#EFE7D2", "leather"], heel: ["#2F5640", "suede"], heeltab: ["#2F5640", "suede"], eyestay: ["#2F5640", "suede"], tongue: ["#EFE7D2", "leather"], lining: ["#D9B44A", "leather"], badge: ["#D9B44A", "leather"], laces: ["#EFE7D2", "cotton"], midsole: ["#E8D9B5", "rubber"], outsole: ["#2F5640", "rubber"] }) },
  { name: "Cloud Mesh", tag: "Sommer", mood: "Luftig und hell.", why: "Weisses Mesh mit hellgrauem Wildleder wirkt leicht und atmungsaktiv.",
    design: D(34, { quarter: ["#F4F4F2", "mesh"], vamp: ["#F4F4F2", "mesh"], toecap: ["#D5D6D8", "suede"], mudguard: ["#D5D6D8", "suede"], heel: ["#D5D6D8", "suede"], heeltab: ["#F4F4F2", "ripstop"], eyestay: ["#D5D6D8", "suede"], tongue: ["#F4F4F2", "mesh"], lining: ["#E6E7E9", "knit"], badge: ["#9AA3AE", "leather"], laces: ["#F4F4F2", "cotton"], midsole: ["#FAFAF8", "eva"], outsole: ["#CFD3D8", "rubber"] }) },
  { name: "Chunky Mocha", tag: "Vorschau Chunky", mood: "Erdiges Braun auf kräftiger Sohle.", why: "Dunkle Brauntöne halten die hohe Sohle im Gleichgewicht.",
    design: D(52, { quarter: ["#6B4C3B", "suede"], vamp: ["#6B4C3B", "suede"], toecap: ["#8A6A55", "nubuck"], mudguard: ["#4A3328", "suede"], heel: ["#4A3328", "suede"], heeltab: ["#E9DFCF", "ripstop"], eyestay: ["#8A6A55", "suede"], tongue: ["#E9DFCF", "mesh"], lining: ["#E9DFCF", "knit"], badge: ["#E9DFCF", "leather"], laces: ["#E9DFCF", "cotton"], midsole: ["#EEE5D3", "eva"], outsole: ["#4A3328", "rubber"] }, { soleType: "chunky", soleFlare: 3, toeSpring: 13, toeWidth: 1.08, toeHeight: 1.1, toeRound: 0.65, width: 1.04 }) },
];

export const SOLE_MIN = 26;
export const SOLE_MAX = 62;
