import { NavLinks } from "./nav-links";

export const DATA_VERIFICATION_URL =
  "https://github.com/minimascientific/sensor-reliability-analytics/blob/main/docs/DATA_VERIFICATION.md";

export function AppSidebar() {
  return (
    <aside className="border-b border-rule bg-canvas md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col md:border-r md:border-b-0">
      <div className="px-4 pt-4 pb-3 md:px-5 md:pt-6 md:pb-6">
        <p className="text-[15px] leading-tight font-semibold tracking-tight">
          Sensor Reliability
          <br className="hidden md:block" /> Analytics
        </p>
        <p className="mt-1 text-xs text-ink-muted">Multi-ion blood sensor program</p>
      </div>
      <nav aria-label="Pages" className="px-2 pb-3 md:flex-1 md:px-3">
        <NavLinks />
      </nav>
      <div className="hidden px-5 py-5 text-xs leading-relaxed text-ink-muted md:block">
        Metric definitions and data checks are documented in{" "}
        <a
          href={DATA_VERIFICATION_URL}
          className="text-ink-secondary underline decoration-rule-strong underline-offset-2 hover:text-ink"
        >
          Data verification
        </a>
        .
      </div>
    </aside>
  );
}
