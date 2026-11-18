/* eslint-disable @next/next/no-img-element -- Bilder sind lokale Data-URLs, next/image bringt hier nichts */
"use client";

import { useEffect, useState } from "react";
import { buildRenderPrompt, RENDER_SCENES, type RenderScene } from "@/lib/render/prompt";
import { useStudio } from "@/lib/store";
import { Button, Chip } from "./ui";

interface RenderResult {
  id: string;
  url: string;
  scene: RenderScene;
  model: string;
  at: number;
}

const USAGE_KEY = "sole-studio.render-usage.v1";
const LIMIT_KEY = "sole-studio.render-limit.v1";
const month = () => new Date().toISOString().slice(0, 7);

function readUsage(): number {
  try {
    const u = JSON.parse(localStorage.getItem(USAGE_KEY) ?? "null");
    return u && u.month === month() ? u.count : 0;
  } catch {
    return 0;
  }
}
function writeUsage(count: number) {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify({ month: month(), count }));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/** Aufnahme der 3D-Ansicht als JPEG (Base64), auf max. 1280 px verkleinert */
function captureViewport(): string | null {
  const src = document.querySelector("main canvas") as HTMLCanvasElement | null;
  if (!src) return null;
  const scale = Math.min(1, 1280 / Math.max(src.width, src.height));
  const c = document.createElement("canvas");
  c.width = Math.round(src.width * scale);
  c.height = Math.round(src.height * scale);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}

// Ergebnisse bleiben für die Sitzung erhalten, auch wenn das Fenster geschlossen wird
let sessionResults: RenderResult[] = [];

export function RenderPanel() {
  const open = useStudio((s) => s.renderOpen);
  const setOpen = useStudio((s) => s.setRenderOpen);
  const design = useStudio((s) => s.design);
  const name = useStudio((s) => s.name);
  const [scene, setScene] = useState<RenderScene>("studio");
  const [aspect, setAspect] = useState<"4:3" | "1:1" | "3:4" | "16:9">("4:3");
  const [extra, setExtra] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<RenderResult[]>(sessionResults);
  const [active, setActive] = useState<RenderResult | null>(sessionResults[0] ?? null);
  const [preview, setPreview] = useState<string | null>(null);
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(30);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setPreview(captureViewport());
    setUsage(readUsage());
    try {
      setLimit(Number(localStorage.getItem(LIMIT_KEY)) || 30);
    } catch {
      /* Speicher nicht verfügbar */
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;
  const prompt = buildRenderPrompt(design, scene, extra);
  const overLimit = usage >= limit;

  const render = async () => {
    const shot = captureViewport();
    if (!shot) return setError("Die 3D-Ansicht konnte nicht aufgenommen werden.");
    setPreview(shot);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: shot.split(",")[1], prompt, aspectRatio: aspect }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Fehler ${res.status}`);
      const r: RenderResult = { id: Math.random().toString(36).slice(2), url: `data:${json.mime};base64,${json.image}`, scene, model: json.model, at: Date.now() };
      sessionResults = [r, ...sessionResults].slice(0, 24);
      setResults(sessionResults);
      setActive(r);
      const n = readUsage() + 1;
      writeUsage(n);
      setUsage(n);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = (r: RenderResult) => {
    const a = document.createElement("a");
    a.href = r.url;
    a.download = `${(name || "entwurf").replace(/[^\p{L}\p{N}\- ]/gu, "").trim()}-${r.scene}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="KI-Foto">
      <div className="grid max-h-full w-full max-w-[1180px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-line-2 bg-panel shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <h2 className="font-display text-[19px] font-extrabold">KI-Foto</h2>
            <p className="text-[12px] text-muted">Macht aus deinem 3D-Entwurf ein fotorealistisches Bild mit Google Gemini.</p>
          </div>
          <Button variant="ghost" onClick={() => setOpen(false)} aria-label="Schliessen">Schliessen</Button>
        </div>

        <div className="grid min-h-0 overflow-y-auto md:grid-cols-[340px_minmax(0,1fr)]">
          <div className="grid content-start gap-4 border-b border-line p-4 md:border-b-0 md:border-r">
            <div className="grid gap-1.5">
              <span className="label">Vorlage aus der 3D-Ansicht</span>
              {preview ? <img src={preview} alt="Aufnahme der aktuellen 3D-Ansicht" className="w-full rounded-lg border border-line" /> : <p className="text-[12px] text-muted">Keine Aufnahme möglich.</p>}
              <span className="text-[11.5px] text-faint">Tipp: Stell vorher die Ansicht ein, die du als Foto willst (z. B. 3/4 oder Seite). Die KI hält sich an diese Perspektive.</span>
            </div>
            <div className="grid gap-1.5">
              <span className="label">Szene</span>
              <div className="flex flex-wrap gap-1.5">
                {RENDER_SCENES.map((s) => <Chip key={s.id} active={scene === s.id} title={s.text} onClick={() => setScene(s.id)}>{s.de}</Chip>)}
              </div>
              <span className="text-[11.5px] text-muted">{RENDER_SCENES.find((s) => s.id === scene)?.text}</span>
            </div>
            <div className="grid gap-1.5">
              <span className="label">Format</span>
              <div className="flex flex-wrap gap-1.5">
                {(["4:3", "1:1", "3:4", "16:9"] as const).map((a) => <Chip key={a} active={aspect === a} onClick={() => setAspect(a)}>{a}</Chip>)}
              </div>
            </div>
            <label htmlFor="render-extra" className="grid gap-1.5">
              <span className="label">Zusätzliche Wünsche</span>
              <textarea id="render-extra" rows={2} value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="z. B. leicht getragen, Regentropfen, Blick von schräg oben" className="w-full resize-none rounded-lg border border-line-2 bg-bg p-2.5 text-[13px]" />
            </label>
            <Button variant="primary" className="min-h-11 text-[14px]" onClick={render} disabled={busy || overLimit}>
              {busy ? "Foto wird gerendert …" : "Foto rendern"}
            </Button>
            {overLimit && <p className="text-[12px] text-warn">Monatslimit erreicht. Du kannst es unten erhöhen.</p>}
            {error && <p className="rounded-lg border border-warn/40 bg-warn/[0.07] p-3 text-[12.5px] leading-snug">{error}</p>}
            <div className="grid gap-1.5 rounded-lg border border-line bg-panel-2 p-3 text-[12px] text-muted">
              <span><b className="font-semibold text-fg">{usage}</b> von <b className="font-semibold text-fg">{limit}</b> Bildern diesen Monat</span>
              <label htmlFor="render-limit" className="flex items-center gap-2">
                Monatslimit
                <input id="render-limit" type="number" min={0} max={500} value={limit} onChange={(e) => { const v = Math.max(0, Number(e.target.value)); setLimit(v); try { localStorage.setItem(LIMIT_KEY, String(v)); } catch { /* */ } }} className="w-16 rounded border border-line-2 bg-raise px-1.5 py-0.5 font-mono text-fg" />
              </label>
              <span>Ein Bild kostet bei Google grob 4 bis 7 Rappen. Alle Bilder tragen ein unsichtbares SynthID-Wasserzeichen.</span>
              <button type="button" className="justify-self-start text-accent underline-offset-2 hover:underline" onClick={() => setShowPrompt((v) => !v)}>
                {showPrompt ? "Beschreibung ausblenden" : "Beschreibung an die KI anzeigen"}
              </button>
              {showPrompt && <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-bg p-2 font-mono text-[10.5px] leading-snug">{prompt}</pre>}
            </div>
          </div>

          <div className="grid content-start gap-3 p-4">
            {active ? (
              <>
                <img src={active.url} alt={`KI-Foto, Szene ${active.scene}`} className="max-h-[62vh] w-full rounded-xl border border-line object-contain" />
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="primary" onClick={() => download(active)}>Bild herunterladen</Button>
                  <span className="text-[11.5px] text-faint">Modell: {active.model}</span>
                </div>
              </>
            ) : (
              <div className="grid min-h-[320px] place-items-center rounded-xl border border-dashed border-line-2 p-6 text-center text-[13px] text-muted">
                {busy ? "Die KI arbeitet. Das dauert meist 10 bis 30 Sekunden." : "Hier erscheint dein fotorealistisches Bild."}
              </div>
            )}
            {results.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {results.map((r) => (
                  <button key={r.id} type="button" onClick={() => setActive(r)} className={`overflow-hidden rounded-lg border ${active?.id === r.id ? "border-accent" : "border-line"}`} aria-label={`Bild ${r.scene} anzeigen`}>
                    <img src={r.url} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11.5px] leading-snug text-faint">Die KI kann Details leicht verändern. Das Foto ist für Präsentation und Feedback gedacht. Verbindlich für die Produktion bleibt dein 3D-Entwurf.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
