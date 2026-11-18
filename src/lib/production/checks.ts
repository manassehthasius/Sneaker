/**
 * Produktions-Check: prüft einen Entwurf auf Herstellbarkeit, Kostentreiber und Pflichtangaben.
 * Die Regeln sind Faustregeln aus der Schuhentwicklung, keine Garantie. Details: /produktion
 */
import * as THREE from "three";
import { MATERIALS } from "../shoe/catalog";
import type { Design, MaterialId, PartId } from "../shoe/types";
import { DEFAULT_SHAPE } from "../shoe/geometry";
import { partExists } from "../shoe/models";

export type CheckLevel = "ok" | "info" | "warn";

export interface ProductionHint {
  level: CheckLevel;
  title: string;
  text: string;
  /** Abschnitt im Produktions-Handbuch */
  anchor: string;
}

const lum = (hex: string) => {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

const UPPER_PARTS: PartId[] = ["quarter", "vamp", "toecap", "mudguard", "heel", "heeltab", "eyestay", "tongue", "badge"];
/** Ungefährer Flächenanteil der sichtbaren Teile am Obermaterial */
const UPPER_AREA: Partial<Record<PartId, number>> = { quarter: 0.3, vamp: 0.24, toecap: 0.1, mudguard: 0.12, heel: 0.08, eyestay: 0.05, tongue: 0.08, heeltab: 0.02, badge: 0.01 };
const WEAR_ZONES: PartId[] = ["toecap", "mudguard", "heel"];
const TEXTILE: MaterialId[] = ["canvas", "mesh", "knit", "ripstop", "cotton", "mohair"];
const SUEDES: MaterialId[] = ["suede", "nubuck"];

/** Kategorie für die Materialkennzeichnung (EU-Richtlinie 94/11/EG) */
export type LabelCategory = "Leder" | "Beschichtetes Leder" | "Textil" | "Sonstiges Material";
export function labelCategory(m: MaterialId): LabelCategory {
  if (m === "leather" || m === "pebble" || m === "suede" || m === "nubuck") return "Leder";
  if (TEXTILE.includes(m)) return "Textil";
  return "Sonstiges Material";
}

function composition(entries: [MaterialId, number][]): string {
  const sum = new Map<LabelCategory, number>();
  let total = 0;
  for (const [m, w] of entries) {
    const c = labelCategory(m);
    sum.set(c, (sum.get(c) ?? 0) + w);
    total += w;
  }
  const sorted = [...sum.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] / total >= 0.8) return sorted[0][0];
  return sorted.slice(0, 2).map(([c, w]) => `${c} (${Math.round((w / total) * 100)} %)`).join(" und ");
}

/** Vorschau der Pflichtkennzeichnung: Obermaterial, Futter, Laufsohle */
export function labelPreview(d: Design) {
  const upper = composition(UPPER_PARTS.filter((id) => partExists(d.shape, id)).map((id) => [d.parts[id].m, UPPER_AREA[id] ?? 0.01]));
  const lining = composition([[d.parts.lining.m, 1]]);
  const sole = composition([[d.parts.outsole.m, 1]]);
  return { upper, lining, sole };
}

export function productionChecks(d: Design): ProductionHint[] {
  const out: ProductionHint[] = [];
  const P = d.parts;

  // 1. Anzahl Material-Farb-Kombinationen
  const combos = new Set(([...UPPER_PARTS, "lining"] as PartId[]).filter((id) => partExists(d.shape, id)).map((id) => `${P[id].m}|${P[id].c.toLowerCase()}`));
  out.push(
    combos.size > 5
      ? { level: "warn", title: `${combos.size} Material-Farb-Kombinationen`, text: "Jede Kombination wird separat beim Lieferanten bestellt, oft mit eigener Mindestmenge. Weniger Kombinationen senken Kosten und Risiko.", anchor: "materialien" }
      : { level: "ok", title: `${combos.size} Material-Farb-Kombinationen`, text: "Überschaubar. Gut für kleine erste Produktionen.", anchor: "materialien" },
  );

  const shape = { ...DEFAULT_SHAPE, ...d.shape };

  // 2. Sohle nach Typ
  if (shape.soleType === "vulc") {
    out.push({ level: "info", title: "Vulkanisierte Sohle", text: "Braucht eine darauf spezialisierte Fabrik und Metall-Leisten. Keine EVA-Zwischensohle möglich. Günstige Werkzeuge, ideal für Canvas.", anchor: "bauweisen" });
  } else if (shape.soleType === "chunky" || shape.soleType === "runner") {
    out.push({ level: "warn", title: shape.soleType === "chunky" ? "Chunky-Sohle" : "Runner-Keilsohle", text: "Eine eigene Sohlenform braucht Gussformen, grob 1500 bis 5000 USD, oft pro Grösse. Frag zuerst nach vorhandenen Sohlen mit ähnlicher Form.", anchor: "kosten" });
  } else out.push(
    d.soleH > 40
      ? { level: "warn", title: "Hohe Sohle", text: "Eine eigene Sohlenform braucht meist eine Gussform, grob 1500 bis 5000 USD, oft pro Grösse. Frag den Hersteller nach vorhandenen Plateau-Sohlen.", anchor: "kosten" }
      : { level: "ok", title: "Standard-Cupsole", text: "Viele Hersteller haben passende Cupsoles auf Lager. Das spart die Gussform.", anchor: "bauweisen" },
  );

  if (shape.shellToe > 0.3) out.push({ level: "info", title: "Shell Toe", text: "Die Gummikappe über der Spitze ist Teil der Sohlenform. Bei einer eigenen Kappe braucht es eine eigene Gussform; manche Hersteller haben Cupsoles mit Kappe auf Lager.", anchor: "bauweisen" });
  if (shape.toecapStyle === "ttoe") out.push({ level: "info", title: "T-Toe", text: "Kappe und Streifen werden meist als ein Stück gestanzt. Die Naht am Streifen sauber im Tech Pack zeichnen.", anchor: "konstruktion" });
  if (shape.laceWidth >= 12) out.push({ level: "info", title: "Breite Schnürsenkel", text: "Ösen und Ösenleiste müssen breit genug sein. Ösendurchmesser im Tech Pack angeben.", anchor: "techpack" });

  // Form
  if (shape.collar >= 0.75) out.push({ level: "info", title: "High-Top", text: "Mehr Material, längere Schnürung und ein gepolsterter Kragen. Der Fabrikpreis liegt meist etwas höher als beim Low-Top.", anchor: "kosten" });
  if (shape.toeWidth < 0.9 || shape.toeRound < 0.25) out.push({ level: "warn", title: "Sehr schmale Spitze", text: "Kann bei breiten Füssen drücken. Passform unbedingt am Muster mit mehreren Personen testen.", anchor: "leisten" });
  if (shape.toeSpring > 18) out.push({ level: "info", title: "Viel Zehenhub", text: "Starker Zehenhub braucht einen passenden Leisten. Frag den Hersteller, ob ein solcher vorhanden ist.", anchor: "leisten" });

  // 3. Textil an Verschleisszonen
  const weak = WEAR_ZONES.filter((id) => partExists(d.shape, id) && (P[id].m === "mesh" || P[id].m === "knit"));
  if (weak.length) out.push({ level: "warn", title: "Mesh an stark beanspruchter Stelle", text: "Spitze, Seitenband und Ferse scheuern am meisten. Mesh und Strick verschleissen dort schnell. Besser Leder, Wildleder oder ein Overlay darüber.", anchor: "materialien" });

  // 4. Helles Wildleder vorne
  const lightSuede = WEAR_ZONES.filter((id) => partExists(d.shape, id) && SUEDES.includes(P[id].m) && lum(P[id].c) > 0.62);
  if (lightSuede.length) out.push({ level: "info", title: "Helles Wildleder an Verschleisszonen", text: "Wird schnell schmutzig. Eine Imprägnierung ab Werk einplanen und im Tech Pack festhalten.", anchor: "materialien" });

  // 5. Perforation
  if (d.details?.perforation) {
    out.push(
      SUEDES.includes(P.toecap.m)
        ? { level: "info", title: "Perforation in Wildleder", text: "Löcher in Wildleder oder Nubuk fransen leichter aus. In Glattleder wird die Perforation sauberer.", anchor: "konstruktion" }
        : { level: "ok", title: "Perforation", text: "Wird mit einem eigenen Stanzwerkzeug gestanzt. Lochbild und Durchmesser im Tech Pack angeben.", anchor: "konstruktion" },
    );
  }

  // 6. Dunkle Laufsohle
  if (lum(P.outsole.c) < 0.08) out.push({ level: "info", title: "Sehr dunkle Laufsohle", text: "Schwarzer Gummi kann auf hellen Böden Streifen hinterlassen. «Non-marking»-Gummi beim Hersteller verlangen.", anchor: "materialien" });

  // 7. EVA als Zwischensohle
  if (P.midsole.m === "eva") out.push({ level: "info", title: "EVA-Zwischensohle", text: "EVA passt zur geklebten Bauweise (Cemented). Eine klassische Cupsole ist aus Gummi. Mit dem Hersteller die Bauweise festlegen.", anchor: "bauweisen" });

  // 8. Farben im Obermaterial
  const colors = new Set((["quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "tongue"] as PartId[]).filter((id) => partExists(d.shape, id)).map((id) => P[id].c.toLowerCase()));
  if (colors.size > 3) out.push({ level: "info", title: `${colors.size} Hauptfarben`, text: "Jede Farbe braucht ein eigenes Farbmuster (Lab Dip) und eine eigene Freigabe. Das kostet Zeit.", anchor: "farben" });

  // 9. Leder-Futter
  if (labelCategory(P.lining.m) === "Leder") out.push({ level: "info", title: "Leder-Futter", text: "Atmungsaktiv und langlebig, aber teurer als Textilfutter.", anchor: "materialien" });

  // 10. Logo
  out.push({ level: "info", title: "Logo-Patch", text: `Herstellungsart festlegen: Prägung, Druck, Stickerei oder gewebtes Etikett. Text: «${(d.details?.logoText ?? "SOLE").toUpperCase()}».`, anchor: "techpack" });

  return out;
}

export function materialFacts(m: MaterialId): string {
  const facts: Record<MaterialId, string> = {
    pebble: "Leder mit deutlich sichtbarer Narbung, geprägt oder natürlich. Robust, kaschiert kleine Kratzer, wirkt hochwertig und lässig.",
    mohair: "Garn aus dem Haar der Angoraziege, leicht flauschig mit Glanz. Als Schnürsenkel ein edles Detail, empfindlicher als Baumwolle.",
    leather: "Glattleder für Sneaker meist um 1,2 bis 1,6 mm. Vollnarbig ist hochwertiger, korrigierter Narben günstiger und gleichmässiger.",
    suede: "Spaltleder mit angerauter Oberfläche, meist 1,2 bis 1,8 mm. Weich, aber empfindlich gegen Wasser und Schmutz.",
    nubuck: "Angeschliffenes Narbenleder, fester als Wildleder, oft 1,8 bis 2,2 mm. Edle, samtige Oberfläche.",
    canvas: "Baumwollgewebe, Gewicht in g/m² oder oz angeben. Günstig, gut zu verarbeiten, ideal für vulkanisierte Schuhe.",
    mesh: "Netzgewebe, atmungsaktiv. Braucht meist eine Verstärkung dahinter und Overlays an Verschleisszonen.",
    knit: "Gestrick, flexibel. Als Einzelteil zugeschnitten oder als ganzes Obermaterial gestrickt (dann eigene Maschinen nötig).",
    ripstop: "Nylon- oder Polyestergewebe mit Verstärkungsraster. Reissfest, leicht, technischer Look.",
    cotton: "Flache Baumwoll-Schnürsenkel. Länge nach Anzahl Ösen und Grösse festlegen, Senkel-Enden (Aglets) aus Kunststoff oder Metall.",
    rubber: "Gummi für Laufsohle und Cupsole. Härte wird in Shore A angegeben. Rutschfestigkeit und Abrieb testen lassen.",
    eva: "Leichter Schaum für Zwischensohlen. Gut gedämpft, aber nicht für vulkanisierte Schuhe geeignet (verträgt die Hitze nicht).",
  };
  return `${MATERIALS[m].de}: ${facts[m]}`;
}
