"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({ variant = "default", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 min-h-9 text-[13px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none";
  const styles = {
    default: "border border-line-2 bg-raise hover:border-accent/40",
    primary: "bg-accent text-accent-ink font-semibold hover:brightness-105",
    ghost: "text-muted hover:text-fg hover:bg-raise",
  }[variant];
  return <button type="button" className={`${base} ${styles} ${className}`} {...rest} />;
}

export function Chip({ active, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`min-h-9 rounded-full border px-3 text-[12.5px] cursor-pointer transition-colors ${active ? "border-accent bg-accent text-accent-ink font-semibold" : "border-line-2 bg-raise hover:border-accent/40"} ${className}`}
      {...rest}
    />
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="label">{title}</span>
        {right}
      </div>
      {children}
    </section>
  );
}
