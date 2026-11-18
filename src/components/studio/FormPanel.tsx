"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_SHAPE, type ShapeParams } from "@/lib/shoe/geometry";
import { interpretWish, MODELS, parseModelFile, readMyModels, SOLE_TYPES, STYLES, writeMyModels, type MyModel } from "@/lib/shoe/models";
import { SOLE_MAX, SOLE_MIN } from "@/lib/shoe/catalog";
import { useStudio } from "@/lib/store";
import { Button, Chip, Section } from "./ui";

type NumKey = Exclude<{ [K in keyof ShapeParams]: ShapeParams[K] extends number ? K : never }[keyof ShapeParams], undefined>;

interface SliderDef { key: NumKey; label: string; min: number; max: number; step: number; fmt: (v: number) => string; left: string; right: string }

const FORM_SLIDERS: SliderDef[] = [
  { key: "collar", label: "Schafthöhe", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.25 ? "Low" : v < 0.75 ? "Mid" : "High"), left: "Low", right: "High" },
  { key: "toeWidth", label: "Breite der Spitze", min: 0.85, max: 1.15, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "schmal", right: "breit" },
  { key: "toeHeight", label: "Höhe der Zehenbox", min: 0.8, max: 1.25, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "flach", right: "hoch" },
  { key: "toeRound", label: "Form der Spitze", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.35 ? "spitz" : v < 0.65 ? "neutral" : "rund"), left: "spitz", right: "rund" },
  { key: "width", label: "Gesamtbreite", min: 0.92, max: 1.08, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "schlank", right: "breit" },
  { key: "toeSpring", label: "Zehenhub", min: 0, max: 24, step: 0.5, fmt: (v) => `${v.toFixed(0)} mm`, left: "flach", right: "gebogen" },
  { key: "soleFlare", label: "Sohlen-Überstand", min: 0, max: 6, step: 0.1, fmt: (v) => `${v.toFixed(1)} mm`, left: "bündig", right: "ausgestellt" },
];

const BUILD_SLIDERS: SliderDef[] = [
  { key: "mudguardHeight", label: "Seitenband", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.04 ? "keins" : v > 0.75 ? "Ollie-Guard" : `${Math.round(v * 100)} %`), left: "keins", right: "hoch" },
  { key: "heelCounter", label: "Fersenkappe", min: 0, max: 1.4, step: 0.01, fmt: (v) => (v < 0.3 ? "keine" : `${Math.round(v * 100)} %`), left: "keine", right: "gross" },
  { key: "eyestayWidth", label: "Breite der Ösenleiste", min: 0.08, max: 0.24, step: 0.005, fmt: (v) => `${Math.round(v * 100)}`, left: "schmal", right: "breit" },
  { key: "eyelets", label: "Ösen pro Seite", min: 0, max: 12, step: 1, fmt: (v) => (v === 0 ? "automatisch" : `${v}`), left: "auto", right: "12" },
  { key: "tongueHeight", label: "Zunge", min: 0, max: 16, step: 0.5, fmt: (v) => `+${v.toFixed(0)} mm`, left: "flach", right: "puffy" },
  { key: "collarDip", label: "Kragenausschnitt", min: 0.3, max: 1.8, step: 0.01, fmt: (v) => (v < 0.75 ? "gerade" : v < 1.25 ? "normal" : "tief"), left: "gerade", right: "tief" },
  { key: "shellToe", label: "Shell Toe (Gummikappe)", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.02 ? "aus" : `${Math.round(v * 100)} %`), left: "aus", right: "voll" },
  { key: "laceWidth", label: "Breite der Schnürsenkel", min: 4, max: 15, step: 0.5, fmt: (v) => `${v} mm`, left: "schmal", right: "breit" },
];

const TOECAPS: [ShapeParams["toecapStyle"], string, string][] = [
  ["cap", "Kappe", "Klassische Zehenkappe als Overlay"],
  ["ttoe", "T-Toe", "Kappe plus Streifen bis zur Schnürung, typisch Terrace"],
  ["none", "Keine", "Clean, ohne Overlay an der Spitze"],
];

export function FormPanel() {
  const design = useStudio((s) => s.design);
  const name = useStudio((s) => s.name);
  const setShape = useStudio((s) => s.setShape);
  const applyModel = useStudio((s) => s.applyModel);
  const applyStyle = useStudio((s) => s.applyStyle);
  const setParts = useStudio((s) => s.setParts);
  const notify = useStudio((s) => s.notify);
  const shape: ShapeParams = { ...DEFAULT_SHAPE, ...design.shape };
  const dragging = useRef(false);
  const [wish, setWish] = useState("");
  const [wishOut, setWishOut] = useState<string | null>(null);

  const runWish = () => {
    const r = interpretWish(wish);
    if (!r.understood.length) {
      setWishOut("Nichts erkannt. Versuch es mit Wörtern wie: high, mid, low, chunky, skate, runner, T-Toe, Shell Toe, Ollie, puffy, schmal, breit, Wildleder, Oliv, Sohle gummibraun.");
      return;
    }
    if (Object.keys(r.shape).length || r.soleH) setShape(r.shape, true, r.soleH);
    for (const m of r.materials) setParts(m.parts, { m: m.m });
    for (const c of r.colors) setParts(c.parts, { c: c.c });
    setWishOut(`Umgesetzt: ${r.understood.join(", ")}.`);
  };

  const slider = (s: SliderDef) => (
    <Slider
      key={s.key}
      id={`f-${s.key}`}
      label={s.label}
      value={shape[s.key]}
      min={s.min}
      max={s.max}
      step={s.step}
      shown={s.fmt(shape[s.key])}
      left={s.left}
      right={s.right}
      onChange={(v) => { setShape({ [s.key]: v }, !dragging.current); dragging.current = true; }}
      onEnd={() => (dragging.current = false)}
    />
  );

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <Section title="Wunsch-Assistent">
        <textarea
          id="wish"
          rows={3}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="z. B. hoher Skate-Schuh mit Ollie-Seitenband, puffy Zunge, Wildleder in Oliv, Sohle gummibraun"
          className="w-full resize-none rounded-lg border border-line-2 bg-bg p-2.5 text-[13px] leading-snug"
          aria-label="Beschreibe dein Modell"
        />
        <Button variant="primary" onClick={runWish} disabled={!wish.trim()}>Modell erstellen</Button>
        {wishOut && <p className="text-[12px] leading-snug text-muted">{wishOut}</p>}
        <p className="text-[11px] leading-snug text-faint">Einfache Version ohne KI. In Phase 3 übernimmt Claude und versteht auch freie Beschreibungen.</p>
      </Section>

      <Section title="Stilrichtungen">
        <p className="text-[11.5px] leading-snug text-faint">Inspiriert von Genres und Designer-Labels, ohne Logos, Streifen oder Muster der Marken.</p>
        <div className="grid gap-1.5">
          {STYLES.map((st) => (
            <div key={st.id} className="grid gap-1.5 rounded-lg border border-line bg-panel-2 p-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold">{st.name}</span>
                <span className="flex gap-0.5">
                  {[...new Set([st.parts.quarter[0], st.parts.toecap[0], st.parts.heel[0], st.parts.outsole[0]])].map((c) => (
                    <span key={c} className="h-3 w-3 rounded-sm border border-white/15" style={{ background: c }} />
                  ))}
                </span>
              </div>
              <span className="text-[11.5px] leading-snug text-muted">{st.text}</span>
              <span className="text-[10.5px] leading-snug text-faint">{st.inspired}</span>
              <div className="flex gap-1.5">
                <Button className="min-h-8 flex-1 px-2 text-[12px]" onClick={() => { applyStyle(st); notify(`Stil «${st.name}» übernommen`); }}>Komplett</Button>
                <Button variant="ghost" className="min-h-8 flex-1 px-2 text-[12px]" onClick={() => { applyModel(st.shape, st.soleH); notify(`Form von «${st.name}» übernommen, Farben bleiben`); }}>Nur Form</Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <MyModels currentName={name} shape={design.shape ?? {}} soleH={design.soleH} onApply={(m) => { applyModel(m.shape, m.soleH); notify(`Eigenes Modell «${m.name}» übernommen`); }} />

      <Section title="Grundformen">
        <div className="grid gap-1.5">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { applyModel(m.shape, m.soleH); notify(`Form «${m.name}» übernommen, Farben bleiben`); }}
              className="grid gap-0.5 rounded-lg border border-line bg-panel-2 p-2.5 text-left hover:border-accent/40"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold">{m.name}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">{m.tag}</span>
              </span>
              <span className="text-[11.5px] leading-snug text-muted">{m.text}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Sohlentyp">
        <div className="flex flex-wrap gap-1.5">
          {SOLE_TYPES.map((t) => (
            <Chip key={t.id} active={shape.soleType === t.id} title={t.text} onClick={() => setShape({ soleType: t.id }, true)}>{t.de}</Chip>
          ))}
        </div>
        <p className="text-[11.5px] leading-snug text-muted">{SOLE_TYPES.find((t) => t.id === shape.soleType)?.text}</p>
      </Section>

      <Section title="Form">
        <Slider
          id="f-soleH"
          label="Sohlenhöhe"
          value={design.soleH}
          min={SOLE_MIN}
          max={SOLE_MAX}
          step={1}
          shown={`${design.soleH} mm`}
          left="flach"
          right="hoch"
          onChange={(v) => { setShape({}, !dragging.current, v); dragging.current = true; }}
          onEnd={() => (dragging.current = false)}
        />
        {FORM_SLIDERS.map(slider)}
      </Section>

      <Section title="Konstruktion">
        <span className="text-[12.5px]">Zehenkappe</span>
        <div className="flex flex-wrap gap-1.5">
          {TOECAPS.map(([id, label, hint]) => (
            <Chip key={id} active={shape.toecapStyle === id} title={hint} onClick={() => setShape({ toecapStyle: id }, true)}>{label}</Chip>
          ))}
        </div>
        {shape.toecapStyle !== "none" && slider({ key: "toecapLength", label: "Länge der Zehenkappe", min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "kurz", right: "lang" })}
        {BUILD_SLIDERS.map(slider)}
        <Button onClick={() => setShape({ ...DEFAULT_SHAPE, soleType: shape.soleType }, true)}>Form und Konstruktion zurücksetzen</Button>
      </Section>
    </div>
  );
}

function MyModels({ currentName, shape, soleH, onApply }: { currentName: string; shape: Partial<ShapeParams>; soleH: number; onApply: (m: MyModel) => void }) {
  const [list, setList] = useState<MyModel[]>([]);
  const [modelName, setModelName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setList(readMyModels()), []);

  const save = (next: MyModel[]) => {
    setList(next);
    if (!writeMyModels(next)) setMsg("Speichern nicht möglich: Der Browser blockiert den lokalen Speicher.");
  };

  const add = () => {
    const n = (modelName || currentName || "Mein Modell").trim();
    save([{ id: Math.random().toString(36).slice(2, 10), name: n, shape: { ...shape }, soleH, createdAt: Date.now() }, ...list]);
    setModelName("");
    setMsg(`«${n}» gespeichert.`);
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ app: "Sole Studio", version: 1, models: list }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sole-studio-modelle.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const importFile = async (file: File) => {
    try {
      const models = parseModelFile(await file.text());
      if (!models.length) throw new Error("leer");
      save([...models, ...list]);
      setMsg(`${models.length} Modell${models.length > 1 ? "e" : ""} importiert.`);
    } catch {
      setMsg("Die Datei konnte nicht gelesen werden. Erwartet wird eine Modell-Datei aus Sole Studio (.json).");
    }
  };

  return (
    <Section title="Meine Modelle">
      <p className="text-[11.5px] leading-snug text-faint">Speichert Form und Konstruktion des aktuellen Schuhs als eigenes Modell. Farben bleiben davon getrennt, so kannst du jedes Modell in vielen Farbkombinationen nutzen.</p>
      <div className="flex gap-1.5">
        <input
          id="my-model-name"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder={currentName || "Name des Modells"}
          className="min-h-9 min-w-0 flex-1 rounded-lg border border-line-2 bg-raise px-2.5 text-[13px]"
          aria-label="Name des Modells"
        />
        <Button variant="primary" onClick={add}>Speichern</Button>
      </div>
      {list.length > 0 && (
        <ul className="grid gap-1.5">
          {list.map((m) => (
            <li key={m.id} className="grid gap-1 rounded-lg border border-line bg-panel-2 p-2.5">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[13px] font-semibold">{m.name}</span>
                <span className="font-mono text-[10px] text-faint">{m.soleH} mm</span>
              </span>
              <div className="flex gap-1.5">
                <Button className="min-h-8 flex-1 px-2 text-[12px]" onClick={() => onApply(m)}>Anwenden</Button>
                {confirm === m.id ? (
                  <Button className="min-h-8 px-2 text-[12px] text-[#e39a85]" onClick={() => { save(list.filter((x) => x.id !== m.id)); setConfirm(null); }}>Wirklich löschen</Button>
                ) : (
                  <Button variant="ghost" className="min-h-8 px-2 text-[12px]" onClick={() => setConfirm(m.id)}>Löschen</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1.5">
        <Button className="flex-1 text-[12px]" onClick={exportAll} disabled={!list.length}>Exportieren</Button>
        <Button className="flex-1 text-[12px]" onClick={() => fileRef.current?.click()}>Importieren</Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Modell-Datei importieren"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ""; }}
        />
      </div>
      {msg && <p className="text-[12px] text-muted">{msg}</p>}
    </Section>
  );
}

function Slider(props: { id: string; label: string; value: number; min: number; max: number; step: number; shown: string; left: string; right: string; onChange: (v: number) => void; onEnd: () => void }) {
  return (
    <label htmlFor={props.id} className="grid gap-1 text-[12.5px]">
      <span className="flex items-baseline justify-between gap-2">
        <span>{props.label}</span>
        <span className="font-mono text-[11px] text-muted">{props.shown}</span>
      </span>
      <input
        id={props.id}
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onPointerDown={props.onEnd}
        onKeyDown={props.onEnd}
        onPointerUp={props.onEnd}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full"
      />
      <span className="flex justify-between text-[10.5px] text-faint"><span>{props.left}</span><span>{props.right}</span></span>
    </label>
  );
}
