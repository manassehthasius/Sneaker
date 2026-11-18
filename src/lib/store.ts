"use client";

import { create } from "zustand";
import { TEMPLATES, type Template } from "./shoe/catalog";
import type { Design, PartId, PartStyle } from "./shoe/types";

export type SceneId = "studio" | "street" | "parking" | "city";

export type ViewPreset = "threeQuarter" | "side" | "front" | "back" | "top" | "bottom" | "explode";

export interface SavedProject {
  id: string;
  name: string;
  design: Design;
  updatedAt: number;
}

interface StudioState {
  design: Design;
  name: string;
  projectId: string;
  selected: PartId;
  mode: "beg" | "pro";
  past: Design[];
  future: Design[];
  /** Bau-Modus: null = aus, sonst Schritt 0..7 */
  bauStep: number | null;
  explode: number;
  view: { preset: ViewPreset; nonce: number };
  projects: SavedProject[];
  toast: string | null;
  /** Darstellungsqualität: hoch = mit Ambient Occlusion */
  quality: "high" | "fast";
  setQuality: (q: "high" | "fast") => void;
  setDetails: (patch: Partial<NonNullable<Design["details"]>>) => void;
  /** Form ändern. `commit` = neuer Schritt im Verlauf */
  setShape: (patch: Partial<NonNullable<Design["shape"]>>, commit: boolean, soleH?: number) => void;
  /** Nur die Form eines Modells übernehmen, Farben behalten */
  applyModel: (shape: NonNullable<Design["shape"]>, soleH: number, name?: string) => void;
  autoRotate: boolean;
  setAutoRotate: (v: boolean) => void;
  scene: SceneId;
  setScene: (s: SceneId) => void;

  select: (id: PartId) => void;
  setParts: (ids: PartId[], patch: Partial<PartStyle>) => void;
  /** Sohlenhöhe ändern. `commit` = neuer Schritt im Verlauf (beim Start einer Regler-Bewegung) */
  setSole: (h: number, commit: boolean) => void;
  loadTemplate: (t: Template) => void;
  undo: () => void;
  redo: () => void;
  setMode: (m: "beg" | "pro") => void;
  setBau: (step: number | null) => void;
  setExplode: (v: number) => void;
  setView: (p: ViewPreset) => void;
  rename: (name: string) => void;
  save: () => void;
  loadProject: (id: string) => void;
  newProject: () => void;
  deleteProject: (id: string) => void;
  hydrate: () => void;
  notify: (msg: string) => void;
}

const STORAGE_KEY = "sole-studio.projects.v1";
const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));
const uid = () => Math.random().toString(36).slice(2, 10);

function readProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProject[]) : [];
  } catch {
    return [];
  }
}
function writeProjects(list: SavedProject[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

const DRAFT_KEY = "sole-studio.draft.v1";
function readDraft(): SavedProject | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const d = raw ? (JSON.parse(raw) as SavedProject) : null;
    return d && d.design && d.design.parts ? d : null;
  } catch {
    return null;
  }
}
/** Aktuellen Entwurf laufend sichern, damit beim Neuladen nichts verloren geht */
export function writeDraft(s: { projectId: string; name: string; design: Design }) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ id: s.projectId, name: s.name, design: s.design, updatedAt: Date.now() }));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useStudio = create<StudioState>((set, get) => {
  const push = (s: StudioState) => ({ past: [...s.past.slice(-80), clone(s.design)], future: [] as Design[] });
  return {
    design: clone(TEMPLATES[0].design),
    name: TEMPLATES[0].name,
    projectId: uid(),
    selected: "toecap",
    mode: "beg",
    past: [],
    future: [],
    bauStep: null,
    explode: 0,
    view: { preset: "threeQuarter", nonce: 0 },
    projects: [],
    toast: null,
    quality: "high",
    setQuality: (q) => set({ quality: q }),
    setShape: (patch, commit, soleH) =>
      set((s) => {
        const design = { ...s.design, shape: { ...s.design.shape, ...patch }, soleH: soleH ?? s.design.soleH };
        return commit ? { ...push(s), design } : { design };
      }),
    applyModel: (shape, soleH, name) =>
      set((s) => ({ ...push(s), design: { ...clone(s.design), shape: { ...shape }, soleH }, name: name ?? s.name })),
    autoRotate: false,
    setAutoRotate: (v) => set({ autoRotate: v }),
    scene: "studio",
    setScene: (sc) => set({ scene: sc }),
    setDetails: (patch) =>
      set((s) => {
        const design = clone(s.design);
        design.details = { ...design.details, ...patch };
        return { ...push(s), design };
      }),

    select: (id) => set({ selected: id }),
    setParts: (ids, patch) =>
      set((s) => {
        const design = clone(s.design);
        for (const id of ids) Object.assign(design.parts[id], patch);
        return { ...push(s), design };
      }),
    setSole: (h, commit) =>
      set((s) => {
        const design = { ...s.design, soleH: h };
        return commit ? { ...push(s), design } : { design };
      }),
    loadTemplate: (t) => set((s) => ({ ...push(s), design: clone(t.design), name: t.name })),
    undo: () =>
      set((s) => {
        if (!s.past.length) return {};
        const prev = s.past[s.past.length - 1];
        return { past: s.past.slice(0, -1), future: [clone(s.design), ...s.future], design: prev };
      }),
    redo: () =>
      set((s) => {
        if (!s.future.length) return {};
        const [next, ...rest] = s.future;
        return { future: rest, past: [...s.past, clone(s.design)], design: next };
      }),
    setMode: (m) => set({ mode: m }),
    setBau: (step) => {
      const prev = get().bauStep;
      set({ bauStep: step, explode: step === null ? 0 : prev === null ? 0.6 : get().explode });
      if (prev === null && step !== null) get().setView("explode");
      if (prev !== null && step === null) get().setView("threeQuarter");
    },
    setExplode: (v) => set({ explode: v }),
    setView: (p) => set((s) => ({ view: { preset: p, nonce: s.view.nonce + 1 } })),
    rename: (name) => set({ name }),
    save: () => {
      const s = get();
      const list = readProjects().filter((p) => p.id !== s.projectId);
      list.unshift({ id: s.projectId, name: s.name, design: clone(s.design), updatedAt: Date.now() });
      const ok = writeProjects(list);
      set({ projects: list });
      get().notify(ok ? `«${s.name}» gespeichert` : "Speichern nicht möglich: Der Browser blockiert den lokalen Speicher.");
    },
    loadProject: (id) => {
      const p = get().projects.find((x) => x.id === id);
      if (!p) return;
      set((s) => ({ ...push(s), design: clone(p.design), name: p.name, projectId: p.id }));
      get().notify(`«${p.name}» geöffnet`);
    },
    newProject: () => set((s) => ({ ...push(s), design: clone(TEMPLATES[0].design), name: "Neuer Entwurf", projectId: uid() })),
    deleteProject: (id) => {
      const list = readProjects().filter((p) => p.id !== id);
      writeProjects(list);
      set({ projects: list });
    },
    hydrate: () => {
      const draft = readDraft();
      set(draft ? { projects: readProjects(), design: draft.design, name: draft.name, projectId: draft.id } : { projects: readProjects() });
    },
    notify: (msg) => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ toast: msg });
      toastTimer = setTimeout(() => set({ toast: null }), 2600);
    },
  };
});
