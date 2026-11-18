"use client";

import { useState } from "react";

const chf = (n: number) => (isFinite(n) ? n.toLocaleString("de-CH", { maximumFractionDigits: 0 }) : "–");
const chf2 = (n: number) => (isFinite(n) ? n.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "–");

function Field({ id, label, hint, value, onChange, step = 1 }: { id: string; label: string; hint?: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label htmlFor={id} className="grid min-w-0 gap-1 text-[13px]">
      <span>{label}</span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-h-10 w-full min-w-0 rounded-lg border border-line-2 bg-raise px-3 font-mono text-[14px] tabular-nums"
      />
      {hint && <span className="text-[11.5px] text-faint">{hint}</span>}
    </label>
  );
}

/** Einfache Kalkulation vom Fabrikpreis bis zum Verkaufspreis. Alle Werte in CHF. */
export function CostCalculator() {
  const [fob, setFob] = useState(32);
  const [pairs, setPairs] = useState(300);
  const [samples, setSamples] = useState(1200);
  const [tooling, setTooling] = useState(0);
  const [freight, setFreight] = useState(4);
  const [packaging, setPackaging] = useState(3);
  const [multiplier, setMultiplier] = useState(2.8);

  const oneOff = samples + tooling;
  const landed = fob + freight + packaging + (pairs > 0 ? oneOff / pairs : 0);
  const retailNet = landed * multiplier;
  const retailGross = retailNet * 1.081;
  const wholesale = retailNet * 0.5;
  const invest = landed * pairs;

  return (
    <div className="grid gap-5 rounded-2xl border border-line bg-panel p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="fob" label="Fabrikpreis pro Paar (FOB)" hint="Angebot des Herstellers" value={fob} onChange={setFob} />
        <Field id="pairs" label="Anzahl Paare" hint="Alle Grössen einer Farbe" value={pairs} onChange={setPairs} step={10} />
        <Field id="samples" label="Musterkosten total" hint="Alle Musterrunden" value={samples} onChange={setSamples} step={50} />
        <Field id="tooling" label="Werkzeuge total" hint="Sohlenform, Stanzmesser, Leisten" value={tooling} onChange={setTooling} step={100} />
        <Field id="freight" label="Fracht pro Paar" hint="Bis zu dir, inkl. Verzollung" value={freight} onChange={setFreight} step={0.5} />
        <Field id="pack" label="Verpackung pro Paar" hint="Schachtel, Seidenpapier, Etiketten" value={packaging} onChange={setPackaging} step={0.5} />
        <label htmlFor="mult" className="grid gap-1 text-[13px] sm:col-span-2">
          <span>Aufschlag auf den Einstandspreis: <b className="font-mono">{multiplier.toFixed(1)}×</b></span>
          <input id="mult" type="range" min={2} max={4} step={0.1} value={multiplier} onChange={(e) => setMultiplier(Number(e.target.value))} />
          <span className="text-[11.5px] text-faint">2× ist die Untergrenze («Keystone»). Für den Direktverkauf werden oft 2,5× bis 3,3× angesetzt.</span>
        </label>
      </div>
      <dl className="grid content-start gap-2.5 rounded-xl bg-panel-2 p-4 text-[13.5px]">
        <Row label="Einmalkosten pro Paar" value={`CHF ${chf2(pairs > 0 ? oneOff / pairs : 0)}`} />
        <Row label="Einstandspreis pro Paar" value={`CHF ${chf2(landed)}`} strong />
        <Row label="Verkaufspreis ohne MWST" value={`CHF ${chf(retailNet)}`} />
        <Row label="Verkaufspreis mit 8,1 % MWST" value={`CHF ${chf(retailGross)}`} strong />
        <Row label="Händlerpreis (ca. 50 %)" value={`CHF ${chf(wholesale)}`} />
        <Row label="Kapitalbedarf Ware" value={`CHF ${chf(invest)}`} />
        <p className="mt-2 border-t border-line pt-3 text-[12px] leading-relaxed text-muted">
          Die Rechnung ist eine Orientierung. Marketing, Versand an Kunden, Retouren, Zahlungsgebühren und deine eigene Arbeit sind nicht enthalten.
        </p>
      </dl>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={`font-mono tabular-nums ${strong ? "text-[15px] font-semibold text-accent" : ""}`}>{value}</dd>
    </div>
  );
}
