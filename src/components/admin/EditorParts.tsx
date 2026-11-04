"use client";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
export function SectionHeading({ step, title, where, action }: { step?: number; title: string; where: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-4">
        {step !== undefined && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">{step}</span>
        )}
        <div>
          <h2 className="text-xl font-medium">{title}</h2>
          <p className="text-sm text-muted-foreground">{where}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

export function RowTools({ i, count, onMove, onRemove }: { i: number; count: number; onMove: (dir: -1 | 1) => void; onRemove: () => void }) {
  const btn = "rounded-full p-2 hover:bg-background disabled:opacity-30";
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => onMove(-1)} className={btn}><ArrowUp className="h-4 w-4" /></button>
      <button type="button" aria-label="Move down" disabled={i === count - 1} onClick={() => onMove(1)} className={btn}><ArrowDown className="h-4 w-4" /></button>
      <button type="button" aria-label="Remove" onClick={onRemove} className={`${btn} text-destructive`}><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}