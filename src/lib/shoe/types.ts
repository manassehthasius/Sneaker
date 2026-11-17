/** Alle auswählbaren Teile eines Sneakers. Die IDs sind stabil und werden gespeichert. */
export type PartId =
  | "quarter"
  | "vamp"
  | "toecap"
  | "mudguard"
  | "heel"
  | "heeltab"
  | "eyestay"
  | "tongue"
  | "lining"
  | "badge"
  | "laces"
  | "midsole"
  | "outsole";

export type MaterialId =
  | "leather"
  | "suede"
  | "nubuck"
  | "canvas"
  | "mesh"
  | "knit"
  | "ripstop"
  | "cotton"
  | "rubber"
  | "eva";

export type PartKind = "upper" | "laces" | "sole";

export interface PartStyle {
  /** Farbe als Hex, z. B. "#EAE3D4" */
  c: string;
  /** Material-ID */
  m: MaterialId;
}

/** Das «Rezept» eines Designs. Alle Werkzeuge (Hand, KI, Vorlagen) ändern nur dieses Objekt. */
export interface Design {
  /** Sichtbare Sohlenhöhe in Millimetern (Rand oben bis Boden) */
  soleH: number;
  parts: Record<PartId, PartStyle>;
}
