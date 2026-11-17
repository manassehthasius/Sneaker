"use client";

import { BUILD_STEPS } from "@/lib/shoe/construction";
import { useStudio } from "@/lib/store";

export function BauPanel() {
  const step = useStudio((s) => s.bauStep) ?? 0;
  const setBau = useStudio((s) => s.setBau);
  const explode = useStudio((s) => s.explode);
  const setExplode = useStudio((s) => s.setExplode);
  const b = BUILD_STEPS[step];
  const last = BUILD_STEPS.length - 1;

  return (
    <div className="glass absolute inset-x-3 bottom-3 grid gap-3 rounded-2xl p-4 text-[#efeae0] md:right-auto md:max-w-[460px] pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/60">Schritt {step + 1} von {BUILD_STEPS.length}</span>
        <div className="flex gap-1" aria-hidden="true">
          {BUILD_STEPS.map((_, i) => (
            <span key={i} className={`h-1.5 w-4 rounded-full ${i <= step ? "bg-accent" : "bg-white/20"}`} />
          ))}
        </div>
      </div>
      <h3 className="font-display text-[20px] font-extrabold leading-tight">{b.title}</h3>
      <p className="text-[13px] leading-relaxed text-white/80">{b.text}</p>
      <p className="border-l-2 border-accent/50 pl-3 text-[12.5px] leading-relaxed">
        <b className="font-semibold text-accent">Für dein Design:</b> {b.tip}
      </p>
      <label htmlFor="explode-range" className="flex items-center gap-3 text-[12.5px]">
        <span>Auseinanderziehen</span>
        <input id="explode-range" type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(Number(e.target.value))} className="flex-1" />
      </label>
      <div className="flex gap-2">
        <button type="button" disabled={step === 0} onClick={() => setBau(step - 1)} className="min-h-9 rounded-lg border border-white/20 px-3 text-[13px] disabled:opacity-40">Zurück</button>
        <button type="button" disabled={step === last} onClick={() => setBau(step + 1)} className="min-h-9 rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-ink disabled:opacity-40">Weiter</button>
      </div>
    </div>
  );
}
