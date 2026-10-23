"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href?: string;
}

/** Pages from the approved plan. Items without an href are not built yet. */
const NAV_ITEMS: NavItem[] = [
  { label: "Executive overview", href: "/" },
  { label: "Reliability analytics" },
  { label: "Manufacturing analytics" },
  { label: "Environmental qualification" },
  { label: "Data explorer" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {NAV_ITEMS.map((item) => {
        if (!item.href) {
          return (
            <li key={item.label}>
              <span
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm whitespace-nowrap text-ink-muted"
                aria-disabled="true"
              >
                {item.label}
                <span className="text-xs text-ink-muted/80">Planned</span>
              </span>
            </li>
          );
        }
        const active = pathname === item.href;
        return (
          <li key={item.label}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors",
                active
                  ? "bg-surface font-medium text-ink shadow-[inset_2px_0_0_var(--ink)]"
                  : "text-ink-secondary hover:bg-surface hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
