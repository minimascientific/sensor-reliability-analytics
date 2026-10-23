import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { STAGE_LABELS, rate } from "@/lib/domain/metrics";
import { formatFraction, formatInt, formatPercent } from "@/lib/format";
import type { StagePassRate, ThroughputYield } from "@/lib/queries/overview";

interface YieldCascadeProps {
  stages: StagePassRate[];
  throughput: ThroughputYield;
}

/**
 * The page's centerpiece: the three test stages in order, each showing the
 * device pass rate next to the record pass rate, ending in rolled throughput
 * yield. Plain HTML (not a chart library) so it reads well to screen readers
 * and stacks cleanly on narrow screens.
 */
export function YieldCascade({ stages, throughput }: YieldCascadeProps) {
  const throughputRate = rate(throughput.devicesPassingAllStages, throughput.devicesTestedAllStages);
  const untested = throughput.devices - throughput.devicesTestedAllStages;

  return (
    <section aria-labelledby="cascade-heading" className="mt-8">
      <h2 id="cascade-heading" className="text-lg font-semibold tracking-tight">
        Pass rates by test stage
      </h2>
      <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-ink-secondary">
        A device passes a stage only when every one of its records in that stage passes, so each
        stage&rsquo;s device pass rate sits below its record pass rate.
      </p>

      <ol className="mt-5 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.1fr]">
        {stages.map((stage) => {
          const deviceRate = rate(stage.passingDevices, stage.devices);
          const recordRate = rate(stage.passingRecords, stage.records);
          return (
            <Fragment key={stage.stage}>
              <li className="relative bg-surface p-5">
                {/* Marks the hand-off to the next stage, sitting on the dividing rule. */}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-rule bg-surface text-ink-muted lg:flex"
                >
                  <ChevronRight className="size-3.5" strokeWidth={2} />
                </span>
                <h3 className="text-sm font-medium text-ink-secondary">
                  {STAGE_LABELS[stage.stage]}
                </h3>
                <p className="mt-3 text-[2.5rem] leading-none font-semibold tracking-tight">
                  {formatPercent(deviceRate)}
                </p>
                <p className="mt-2 text-sm text-ink-secondary">
                  of devices passed ({formatFraction(stage.passingDevices, stage.devices)})
                </p>

                <dl className="mt-5 space-y-2.5 text-xs">
                  <RateBar label="Per device" value={deviceRate} tone="strong" />
                  <RateBar label="Per record" value={recordRate} tone="soft" />
                </dl>
                <p className="mt-3 text-xs text-ink-muted">
                  {formatInt(stage.passingRecords)} of {formatInt(stage.records)} records passed
                </p>
              </li>
            </Fragment>
          );
        })}

        <li className="bg-surface-sunken p-5">
          <h3 className="text-sm font-medium text-ink-secondary">Rolled throughput yield</h3>
          <p className="mt-3 text-[2.5rem] leading-none font-semibold tracking-tight">
            {formatPercent(throughputRate)}
          </p>
          <p className="mt-2 text-sm text-ink-secondary">
            of devices passed all three stages (
            {formatFraction(throughput.devicesPassingAllStages, throughput.devicesTestedAllStages)})
          </p>
          <dl className="mt-5 space-y-2.5 text-xs">
            <RateBar label="Per device" value={throughputRate} tone="strong" />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">
            {untested === 0
              ? "Every device has records in all three stages."
              : `${formatInt(untested)} devices lack records in at least one stage and are excluded.`}
          </p>
        </li>
      </ol>
    </section>
  );
}

function RateBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | null;
  tone: "strong" | "soft";
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_3.25rem] items-center gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="h-1.5 rounded-full bg-surface-sunken" aria-hidden="true">
        <div
          className={tone === "strong" ? "h-full rounded-full bg-measure" : "h-full rounded-full bg-measure-soft"}
          style={{ width: `${(value ?? 0) * 100}%` }}
        />
      </dd>
      <dd className="text-right text-ink-secondary">{formatPercent(value)}</dd>
    </div>
  );
}
