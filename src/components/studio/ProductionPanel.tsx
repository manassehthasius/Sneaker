"use client";

import Link from "next/link";
import { labelPreview, productionChecks, type CheckLevel } from "@/lib/production/checks";
import { useStudio } from "@/lib/store";
import { Section } from "./ui";

const DOT: Record<CheckLevel, string> = { ok: "bg-ok", info: "bg-accent/70", warn: "bg-warn" };

export function ProductionPanel() {
  const design = useStudio((s) => s.design);
  const hints = productionChecks(design);
  const label = labelPreview(design);
  const warnings = hints.filter((h) => h.level === "warn").length;

  return (
    <Section
      title="Produktions-Check"
      right={<span className={`font-mono text-[10.5px] ${warnings ? "text-warn" : "text-ok"}`}>{warnings ? `${warnings} Hinweis${warnings > 1 ? "e" : ""}` : "Alles im grünen Bereich"}</span>}
    >
      <ul className="grid gap-2">
        {hints.map((h) => (
          <li key={h.title} className="grid grid-cols-[10px_1fr] gap-2.5 text-[12.5px] leading-snug">
            <span className={`mt-1.5 h-2 w-2 rounded-full ${DOT[h.level]}`} aria-label={h.level === "warn" ? "Achtung" : h.level === "ok" ? "In Ordnung" : "Hinweis"} />
            <span>
              <b className="font-semibold">{h.title}.</b> <span className="text-muted">{h.text}</span>{" "}
              <Link href={`/produktion#${h.anchor}`} className="whitespace-nowrap text-accent underline-offset-2 hover:underline">Mehr dazu</Link>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 grid gap-1 rounded-lg border border-line bg-panel-2 p-3 text-[12px]">
        <span className="label">Materialkennzeichnung (EU)</span>
        <span><span className="text-faint">Obermaterial:</span> {label.upper}</span>
        <span><span className="text-faint">Futter und Decksohle:</span> {label.lining}</span>
        <span><span className="text-faint">Laufsohle:</span> {label.sole}</span>
        <Link href="/produktion#recht" className="mt-1 text-accent underline-offset-2 hover:underline">Was muss auf das Etikett?</Link>
      </div>
    </Section>
  );
}
