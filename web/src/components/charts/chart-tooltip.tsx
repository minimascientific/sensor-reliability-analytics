import type { ReactNode } from "react";

/** Shared tooltip panel for Recharts custom `content` renderers. */
export function ChartTooltip({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-44 rounded-md border border-rule bg-surface px-3 py-2 text-xs shadow-lg shadow-black/5">
      <p className="font-medium text-ink">{title}</p>
      <div className="mt-1.5 space-y-1 text-ink-secondary">{children}</div>
    </div>
  );
}

export function TooltipRow({ label, value, swatch }: { label: string; value: ReactNode; swatch?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-1.5">
        {swatch ? (
          <span aria-hidden="true" className="size-2 rounded-full" style={{ background: swatch }} />
        ) : null}
        {label}
      </span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
