"use client";

import { useRef } from "react";
import { SOLE_MAX, SOLE_MIN } from "@/lib/shoe/catalog";
import { useStudio, type ViewPreset } from "@/lib/store";

const VIEWS: [ViewPreset, string][] = [
  ["threeQuarter", "3/4"],
  ["side", "Seite"],
  ["front", "Vorne"],
  ["back", "Hinten"],
  ["top", "Oben"],
  ["bottom", "Unten"],
];

export function ViewportTools() {
  const soleH = useStudio((s) => s.design.soleH);
  const setSole = useStudio((s) => s.setSole);
  const setView = useStudio((s) => s.setView);
  const bauStep = useStudio((s) => s.bauStep);
  const setBau = useStudio((s) => s.setBau);
  const quality = useStudio((s) => s.quality);
  const setQuality = useStudio((s) => s.setQuality);
  const dragging = useRef(false);

  const soleType = soleH < 38 ? "Court-Cupsole" : soleH < 48 ? "Plateau" : "Chunky";

  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <div className="glass pointer-events-auto flex flex-wrap gap-0.5 rounded-xl p-1 text-[12px] text-[#efeae0]" role="group" aria-label="Ansicht">
          {VIEWS.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setView(id)} className="min-h-8 rounded-lg px-2.5 hover:bg-white/10">
              {label}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          onClick={() => setQuality(quality === "high" ? "fast" : "high")}
          title="Hohe Qualität: weiche Schatten in Falten und Kanten. Schnell: flüssiger auf älteren Geräten."
          className="glass min-h-9 rounded-xl px-3 text-[12.5px] text-[#efeae0] hover:bg-black/70"
        >
          Qualität: {quality === "high" ? "Hoch" : "Schnell"}
        </button>
        <button
          type="button"
          onClick={() => setBau(bauStep === null ? 0 : null)}
          aria-pressed={bauStep !== null}
          className={`min-h-9 rounded-xl px-3.5 text-[12.5px] font-semibold ${bauStep !== null ? "bg-accent text-accent-ink" : "glass text-[#efeae0] hover:bg-black/70"}`}
        >
          {bauStep !== null ? "Bau-Modus beenden" : "Bau-Modus"}
        </button>
        </div>
      </div>

      {bauStep === null && (
        <div className="glass absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3.5 py-2.5 text-[12.5px] text-[#efeae0] pb-[max(10px,env(safe-area-inset-bottom))]">
          <label htmlFor="sole-range" className="flex min-w-[220px] flex-1 items-center gap-3">
            <span>Sohlenhöhe</span>
            <input
              id="sole-range"
              type="range"
              min={SOLE_MIN}
              max={SOLE_MAX}
              step={1}
              value={soleH}
              onPointerDown={() => (dragging.current = false)}
              onChange={(e) => {
                setSole(Number(e.target.value), !dragging.current);
                dragging.current = true;
              }}
              onPointerUp={() => (dragging.current = false)}
              onKeyDown={() => (dragging.current = false)}
              className="flex-1"
            />
          </label>
          <output htmlFor="sole-range" className="min-w-[48px] text-right font-mono text-[12px]">{soleH} mm</output>
          <span className="opacity-75">{soleType}</span>
        </div>
      )}
    </>
  );
}
