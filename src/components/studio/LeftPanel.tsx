"use client";

import { useState } from "react";
import { PARTS, TEMPLATES } from "@/lib/shoe/catalog";
import { partExists } from "@/lib/shoe/models";
import { useStudio } from "@/lib/store";
import { FormPanel } from "./FormPanel";
import { Button } from "./ui";

type Tab = "parts" | "form" | "templates" | "projects";

export function LeftPanel({ onPick }: { onPick?: () => void }) {
  const [tab, setTab] = useState<Tab>("parts");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 p-2.5">
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-bg p-1" role="tablist">
        {([["parts", "Teile"], ["form", "Form"], ["templates", "Farben"], ["projects", "Projekte"]] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-8 rounded-md text-[11.5px] ${tab === id ? "bg-raise text-fg" : "text-muted hover:text-fg"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "parts" && <PartList onPick={onPick} />}
      {tab === "form" && <FormPanel />}
      {tab === "templates" && <TemplateList onPick={onPick} />}
      {tab === "projects" && <ProjectList onPick={onPick} />}
    </div>
  );
}

function PartList({ onPick }: { onPick?: () => void }) {
  const design = useStudio((s) => s.design);
  const selected = useStudio((s) => s.selected);
  const select = useStudio((s) => s.select);
  return (
    <ul className="grid gap-0.5">
      {PARTS.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            aria-current={selected === p.id}
            onClick={() => { select(p.id); onPick?.(); }}
            className={`grid min-h-10 w-full grid-cols-[18px_1fr] items-center gap-2.5 rounded-lg border px-2 py-1.5 text-left ${selected === p.id ? "border-accent/40 bg-accent/10" : "border-transparent hover:bg-raise"} ${partExists(design.shape, p.id) ? "" : "opacity-45"}`}
            title={partExists(design.shape, p.id) ? undefined : "In diesem Modell nicht vorhanden"}
          >
            <span className="h-[18px] w-[18px] rounded-full border border-white/20" style={{ background: design.parts[p.id].c }} />
            <span className="leading-tight">
              <span className="block text-[13px]">{p.de}</span>
              <span className="block font-mono text-[10px] text-faint">{p.en}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TemplateList({ onPick }: { onPick?: () => void }) {
  const loadTemplate = useStudio((s) => s.loadTemplate);
  const notify = useStudio((s) => s.notify);
  return (
    <ul className="grid gap-2">
      {TEMPLATES.map((t) => {
        const cols = [...new Set((["quarter", "toecap", "heel", "heeltab", "midsole", "outsole"] as const).map((id) => t.design.parts[id].c))];
        return (
          <li key={t.name}>
            <button
              type="button"
              onClick={() => { loadTemplate(t); notify(`Vorlage «${t.name}» geladen`); onPick?.(); }}
              className="grid w-full gap-1.5 rounded-lg border border-line bg-panel-2 p-2.5 text-left hover:border-accent/40"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-semibold">{t.name}</span>
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">{t.tag}</span>
              </span>
              <span className="flex gap-1">
                {cols.map((c) => <span key={c} className="h-4 w-4 rounded border border-white/15" style={{ background: c }} />)}
              </span>
              <span className="text-[12px] leading-snug text-muted">{t.why}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectList({ onPick }: { onPick?: () => void }) {
  const projects = useStudio((s) => s.projects);
  const projectId = useStudio((s) => s.projectId);
  const loadProject = useStudio((s) => s.loadProject);
  const deleteProject = useStudio((s) => s.deleteProject);
  const newProject = useStudio((s) => s.newProject);
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="grid gap-2">
      <Button onClick={() => { newProject(); onPick?.(); }}>Neuer Entwurf</Button>
      {projects.length === 0 && (
        <p className="rounded-lg border border-dashed border-line-2 p-3 text-[12.5px] text-muted">
          Noch nichts gespeichert. Mit «Speichern» oben landet dein Entwurf hier. Gespeichert wird vorerst in diesem Browser.
        </p>
      )}
      <ul className="grid gap-1.5">
        {projects.map((p) => (
          <li key={p.id} className={`grid gap-1 rounded-lg border p-2.5 ${p.id === projectId ? "border-accent/40" : "border-line"} bg-panel-2`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold">{p.name}</span>
              <span className="flex gap-0.5">
                {(["quarter", "toecap", "heel"] as const).map((id) => <span key={id} className="h-3.5 w-3.5 rounded-sm border border-white/15" style={{ background: p.design.parts[id].c }} />)}
              </span>
            </div>
            <span className="text-[11px] text-faint">{new Date(p.updatedAt).toLocaleString("de-CH", { dateStyle: "short", timeStyle: "short" })}</span>
            <div className="flex gap-1.5">
              <Button className="flex-1" onClick={() => { loadProject(p.id); onPick?.(); }}>Öffnen</Button>
              {confirm === p.id ? (
                <Button onClick={() => { deleteProject(p.id); setConfirm(null); }} className="text-[#e39a85]">Wirklich löschen</Button>
              ) : (
                <Button variant="ghost" onClick={() => setConfirm(p.id)}>Löschen</Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
