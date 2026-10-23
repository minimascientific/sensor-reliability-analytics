import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A titled page section. The description states the question the content answers. */
export function Section({
  id,
  title,
  description,
  className,
  children,
}: {
  id: string;
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className={cn("min-w-0", className)}>
      <h2 id={`${id}-heading`} className="text-base font-semibold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 mb-4 max-w-[68ch] text-sm text-ink-secondary">{description}</p>
      {children}
    </section>
  );
}
