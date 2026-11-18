"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useStudio, writeDraft } from "@/lib/store";
import { BauPanel } from "./BauPanel";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { TopBar } from "./TopBar";
import { ViewportTools } from "./ViewportTools";

const Viewport = dynamic(() => import("@/components/viewer/Viewport"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-[13px] text-black/50">Studio lädt …</div>,
});

export default function Studio() {
  const hydrate = useStudio((s) => s.hydrate);
  const toast = useStudio((s) => s.toast);
  const bauStep = useStudio((s) => s.bauStep);
  const [leftOpen, setLeftOpen] = useState(false);

  useEffect(() => {
    hydrate();
    // Nur in der Entwicklung: Zugriff für automatische Tests
    if (process.env.NODE_ENV !== "production") (window as unknown as { __studio: typeof useStudio }).__studio = useStudio;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const st = useStudio.getState();
      if (e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); st.undo(); }
      else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") { e.preventDefault(); st.redo(); }
      else if (e.key.toLowerCase() === "s") { e.preventDefault(); st.save(); }
    };
    window.addEventListener("keydown", onKey);
    let t: ReturnType<typeof setTimeout> | null = null;
    const unsub = useStudio.subscribe((st, prev) => {
      if (st.design === prev.design && st.name === prev.name) return;
      if (t) clearTimeout(t);
      t = setTimeout(() => writeDraft(st), 400);
    });
    return () => {
      window.removeEventListener("keydown", onKey);
      unsub();
      if (t) clearTimeout(t);
    };
  }, [hydrate]);

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] bg-bg">
      <TopBar onToggleLeft={() => setLeftOpen((v) => !v)} />
      <div className="relative grid min-h-0 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,44%)] md:grid-cols-[minmax(0,1fr)_300px] md:grid-rows-1 max-lg:portrait:grid-cols-1 max-lg:portrait:grid-rows-[minmax(0,1fr)_minmax(0,40%)] lg:grid-cols-[236px_minmax(0,1fr)_300px]">
        <aside
          className={`scroll-thin z-20 min-h-0 overflow-y-auto border-r border-line bg-panel lg:static lg:block ${leftOpen ? "absolute inset-y-0 left-0 w-[260px] shadow-2xl" : "hidden"}`}
          aria-label="Teile und Vorlagen"
        >
          <LeftPanel onPick={() => setLeftOpen(false)} />
        </aside>
        <main className="viewport-bg relative min-h-[360px]">
          <Viewport />
          <ViewportTools />
          {bauStep !== null && <BauPanel />}
        </main>
        <aside className="scroll-thin min-h-0 overflow-y-auto border-t border-line bg-panel md:border-l md:border-t-0 max-lg:portrait:border-l-0 max-lg:portrait:border-t" aria-label="Eigenschaften">
          <RightPanel />
        </aside>
      </div>
      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-line-2 bg-panel-2 px-4 py-2 text-[13px] shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
