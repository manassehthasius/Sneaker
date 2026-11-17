"use client";

import { MATERIALS, MATERIALS_FOR, PALETTE, PART, PARTS } from "@/lib/shoe/catalog";
import type { PartId } from "@/lib/shoe/types";
import { useStudio } from "@/lib/store";
import { Chip, Section } from "./ui";

const MAIN_UPPER: PartId[] = ["quarter", "vamp", "toecap", "mudguard", "heel", "eyestay", "tongue"];

export function RightPanel() {
  const design = useStudio((s) => s.design);
  const selected = useStudio((s) => s.selected);
  const select = useStudio((s) => s.select);
  const mode = useStudio((s) => s.mode);
  const setParts = useStudio((s) => s.setParts);
  const p = PART[selected];
  const cur = design.parts[selected];

  const colorCount = new Set(MAIN_UPPER.map((id) => design.parts[id].c.toLowerCase())).size;
  const ok = colorCount <= 3;

  return (
    <div className="grid gap-5 p-4">
      {/* Teil-Auswahl für schmale Bildschirme (ohne linke Spalte) */}
      <div className="lg:hidden">
        <label className="label mb-1.5 block" htmlFor="part-select">Teil</label>
        <select
          id="part-select"
          value={selected}
          onChange={(e) => select(e.target.value as PartId)}
          className="min-h-10 w-full rounded-lg border border-line-2 bg-raise px-2.5 text-[14px]"
        >
          {PARTS.map((x) => <option key={x.id} value={x.id}>{x.de} · {x.en}</option>)}
        </select>
      </div>

      <div>
        <h2 className="font-display text-[22px] font-extrabold leading-tight">{p.de}</h2>
        <p className="mt-0.5 font-mono text-[11px] text-faint">{p.en} · {MATERIALS[cur.m].de}</p>
      </div>

      {mode === "beg" && (
        <div className="grid gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] p-3 text-[12.5px] leading-relaxed">
          <p>{p.info}</p>
          <p><b className="font-semibold text-accent">Bau:</b> {p.build}</p>
          <p><b className="font-semibold text-accent">Tipp:</b> {p.tip}</p>
        </div>
      )}

      <Section title="Material">
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS_FOR[p.kind].map((m) => (
            <Chip key={m} active={cur.m === m} onClick={() => setParts([selected], { m })}>{MATERIALS[m].de}</Chip>
          ))}
        </div>
      </Section>

      <Section title="Farbe · Casual-Palette">
        <div className="grid grid-cols-6 gap-1.5">
          {PALETTE.map(([n, h]) => (
            <button
              key={h}
              type="button"
              title={n}
              aria-label={n}
              aria-pressed={cur.c.toLowerCase() === h.toLowerCase()}
              onClick={() => setParts([selected], { c: h })}
              className={`aspect-square rounded-lg border border-white/15 ${cur.c.toLowerCase() === h.toLowerCase() ? "outline-2 outline-offset-2 outline-accent" : ""}`}
              style={{ background: h }}
            />
          ))}
        </div>
        <div className="mt-1 flex items-center gap-2.5 text-[12.5px] text-muted">
          <input
            id="custom-color"
            type="color"
            value={cur.c.toLowerCase()}
            onChange={(e) => setParts([selected], { c: e.target.value })}
            className="h-9 w-11 cursor-pointer rounded-lg border border-line-2 bg-raise p-0.5"
            aria-label="Eigene Farbe"
          />
          <span>Eigene Farbe</span>
          {mode === "pro" && <span className="ml-auto font-mono text-[12px] text-fg">{cur.c.toUpperCase()}</span>}
        </div>
      </Section>

      {p.kind === "upper" && selected !== "lining" && (
        <button
          type="button"
          onClick={() => setParts(MAIN_UPPER.filter((id) => design.parts[id].c.toLowerCase() === cur.c.toLowerCase()), { m: cur.m })}
          className="text-left text-[12px] text-muted underline decoration-line-2 underline-offset-4 hover:text-fg"
        >
          Material auf alle Teile in dieser Farbe übertragen
        </button>
      )}

      <div className="flex items-start gap-2.5 border-t border-line pt-3 text-[12.5px]">
        <span className={`mt-1.5 h-2 w-2 flex-none rounded-full ${ok ? "bg-ok" : "bg-warn"}`} />
        <span>
          <b className="font-semibold">{colorCount} Hauptfarbe{colorCount === 1 ? "" : "n"} im Obermaterial.</b>{" "}
          {ok ? "Im empfohlenen Bereich." : "Mehr als die empfohlenen 3. Das kann gewollt sein, wirkt aber schnell unruhig."}
        </span>
      </div>
    </div>
  );
}
