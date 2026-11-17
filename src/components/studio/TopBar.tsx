"use client";

import { useStudio } from "@/lib/store";
import { Button } from "./ui";

function exportPng(name: string) {
  const canvas = document.querySelector("main canvas") as HTMLCanvasElement | null;
  if (!canvas) return false;
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.replace(/[^\p{L}\p{N}\- ]/gu, "").trim() || "entwurf"}.png`;
  a.click();
  return true;
}

export function TopBar({ onToggleLeft }: { onToggleLeft: () => void }) {
  const name = useStudio((s) => s.name);
  const rename = useStudio((s) => s.rename);
  const mode = useStudio((s) => s.mode);
  const setMode = useStudio((s) => s.setMode);
  const canUndo = useStudio((s) => s.past.length > 0);
  const canRedo = useStudio((s) => s.future.length > 0);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const save = useStudio((s) => s.save);
  const notify = useStudio((s) => s.notify);

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel-2 px-3 py-2 pl-[max(12px,env(safe-area-inset-left))] pr-[max(12px,env(safe-area-inset-right))]">
      <button type="button" className="rounded-md p-1.5 text-muted hover:bg-raise lg:hidden" onClick={onToggleLeft} aria-label="Teile und Vorlagen anzeigen">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 5h14M3 10h14M3 15h14" /></svg>
      </button>
      <div className="flex items-center gap-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-accent font-display text-[10px] font-black text-accent-ink">SS</span>
        <span className="font-display text-[14px] font-extrabold tracking-wide [font-stretch:125%]">SOLE STUDIO</span>
      </div>
      <label className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
        <span className="hidden sm:inline">Entwurf</span>
        <input
          id="project-name"
          value={name}
          onChange={(e) => rename(e.target.value)}
          className="min-w-0 max-w-[200px] rounded-md border border-transparent bg-transparent px-1.5 py-1 text-fg hover:border-line-2 focus:border-line-2 focus:outline-none"
          aria-label="Name des Entwurfs"
        />
      </label>
      <div className="flex-1" />
      <div className="inline-flex overflow-hidden rounded-lg border border-line-2" role="group" aria-label="Modus">
        {(["beg", "pro"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-9 px-3 text-[12px] ${mode === m ? "bg-accent font-semibold text-accent-ink" : "text-muted hover:text-fg"}`}
          >
            {m === "beg" ? "Anfänger" : "Profi"}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button onClick={undo} disabled={!canUndo} title="Rückgängig (Ctrl+Z)">Rückgängig</Button>
        <Button onClick={redo} disabled={!canRedo} title="Wiederholen (Ctrl+Shift+Z)" className="hidden sm:inline-flex">Wiederholen</Button>
        <Button onClick={save} title="Speichern (Ctrl+S)">Speichern</Button>
        <Button variant="primary" onClick={() => { if (exportPng(name)) notify("Bild exportiert"); }}>PNG exportieren</Button>
      </div>
    </header>
  );
}
