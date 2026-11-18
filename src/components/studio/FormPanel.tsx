"use client";

import { useRef, useState } from "react";
import { DEFAULT_SHAPE, type ShapeParams } from "@/lib/shoe/geometry";
import { interpretWish, MODELS, SOLE_TYPES } from "@/lib/shoe/models";
import { SOLE_MAX, SOLE_MIN } from "@/lib/shoe/catalog";
import { useStudio } from "@/lib/store";
import { Button, Chip, Section } from "./ui";

type NumKey = "collar" | "toeWidth" | "toeHeight" | "toeRound" | "width" | "toeSpring" | "soleFlare";

const SLIDERS: { key: NumKey; label: string; min: number; max: number; step: number; fmt: (v: number) => string; left: string; right: string }[] = [
  { key: "collar", label: "Schafthöhe", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.25 ? "Low" : v < 0.75 ? "Mid" : "High"), left: "Low", right: "High" },
  { key: "toeWidth", label: "Breite der Spitze", min: 0.85, max: 1.15, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "schmal", right: "breit" },
  { key: "toeHeight", label: "Höhe der Zehenbox", min: 0.8, max: 1.25, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "flach", right: "hoch" },
  { key: "toeRound", label: "Form der Spitze", min: 0, max: 1, step: 0.01, fmt: (v) => (v < 0.35 ? "spitz" : v < 0.65 ? "neutral" : "rund"), left: "spitz", right: "rund" },
  { key: "width", label: "Gesamtbreite", min: 0.92, max: 1.08, step: 0.01, fmt: (v) => `${Math.round(v * 100)} %`, left: "schlank", right: "breit" },
  { key: "toeSpring", label: "Zehenhub", min: 0, max: 24, step: 0.5, fmt: (v) => `${v.toFixed(0)} mm`, left: "flach", right: "gebogen" },
  { key: "soleFlare", label: "Sohlen-Überstand", min: 0, max: 6, step: 0.1, fmt: (v) => `${v.toFixed(1)} mm`, left: "bündig", right: "ausgestellt" },
];

export function FormPanel() {
  const design = useStudio((s) => s.design);
  const setShape = useStudio((s) => s.setShape);
  const applyModel = useStudio((s) => s.applyModel);
  const setParts = useStudio((s) => s.setParts);
  const notify = useStudio((s) => s.notify);
  const shape: ShapeParams = { ...DEFAULT_SHAPE, ...design.shape };
  const dragging = useRef(false);
  const [wish, setWish] = useState("");
  const [wishOut, setWishOut] = useState<string | null>(null);

  const runWish = () => {
    const r = interpretWish(wish);
    if (!r.understood.length) {
      setWishOut("Nichts erkannt. Versuch es mit Wörtern wie: high, mid, low, chunky, skate, runner, schmal, breit, rund, Wildleder, Oliv, Sohle gummibraun.");
      return;
    }
    if (Object.keys(r.shape).length || r.soleH) setShape(r.shape, true, r.soleH);
    for (const m of r.materials) setParts(m.parts, { m: m.m });
    for (const c of r.colors) setParts(c.parts, { c: c.c });
    setWishOut(`Umgesetzt: ${r.understood.join(", ")}.`);
  };

  return (
    <div className="grid gap-5">
      <Section title="Wunsch-Assistent">
        <textarea
          id="wish"
          rows={3}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder="z. B. hoher Basketball-Schuh, dicke Sohle, schmale Spitze, Wildleder in Oliv, Sohle gummibraun"
          className="w-full resize-none rounded-lg border border-line-2 bg-bg p-2.5 text-[13px] leading-snug"
          aria-label="Beschreibe dein Modell"
        />
        <Button variant="primary" onClick={runWish} disabled={!wish.trim()}>Modell erstellen</Button>
        {wishOut && <p className="text-[12px] leading-snug text-muted">{wishOut}</p>}
        <p className="text-[11px] leading-snug text-faint">Einfache Version ohne KI. In Phase 3 übernimmt Claude und versteht auch freie Beschreibungen.</p>
      </Section>

      <Section title="Modelle">
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
        {SLIDERS.map((s) => (
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
        ))}
        <Button onClick={() => setShape({ ...DEFAULT_SHAPE, soleType: shape.soleType }, true)}>Form zurücksetzen</Button>
      </Section>
    </div>
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
