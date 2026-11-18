"use client";

import { useEffect, useState } from "react";

const KEY = "sole-studio.dfm-checklist.v1";

export function Checklist({ items }: { items: { title: string; text: string }[] }) {
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setDone(JSON.parse(raw));
    } catch {
      /* Speicher nicht verfügbar */
    }
  }, []);

  const toggle = (i: number) => {
    const next = done.map((v, k) => (k === i ? !v : v));
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* Speicher nicht verfügbar */
    }
  };
  const count = done.filter(Boolean).length;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-[13px] text-muted">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-raise">
          <div className="h-full bg-accent transition-[width]" style={{ width: `${(count / items.length) * 100}%` }} />
        </div>
        <span className="font-mono tabular-nums">{count} / {items.length}</span>
      </div>
      <ul className="grid gap-1.5">
        {items.map((it, i) => (
          <li key={it.title}>
            <label htmlFor={`dfm-${i}`} className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 ${done[i] ? "border-accent/30 bg-accent/[0.06]" : "border-line bg-panel"}`}>
              <input id={`dfm-${i}`} type="checkbox" checked={done[i] ?? false} onChange={() => toggle(i)} className="mt-0.5 h-5 w-5 flex-none accent-[var(--color-accent)]" />
              <span className="grid gap-0.5">
                <span className="text-[14px] font-semibold">{it.title}</span>
                <span className="text-[13px] leading-relaxed text-muted">{it.text}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
