"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { ION_COLORS, ION_SYMBOLS, IONS, type Ion } from "@/lib/domain/metrics";
import { formatPercent } from "@/lib/format";
import { spreadLabels } from "@/lib/label-layout";
import { ChartTooltip, TooltipRow } from "./chart-tooltip";

/** One row per test day, one key per ion holding the record pass rate (0–1). */
export type ReliabilityDayPoint = { testDay: number } & Partial<Record<Ion, number | null>>;

interface ReliabilityDayChartProps {
  data: ReliabilityDayPoint[];
}

const AXIS_TICK = { fill: "var(--ink-muted)", fontSize: 11 };
const CHART_HEIGHT = 240;
const MARGIN_TOP = 8;
const X_AXIS_HEIGHT = 30;
/** Vertical pixels available to the plot, used to keep end labels 13px apart. */
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN_TOP - X_AXIS_HEIGHT;

export function ReliabilityDayChart({ data }: ReliabilityDayChartProps) {
  const values = data.flatMap((d) =>
    IONS.map((ion) => d[ion]).filter((v): v is number => typeof v === "number"),
  );
  if (values.length === 0) {
    return <p className="text-sm text-ink-muted">No reliability records yet.</p>;
  }
  // Zoomed axis (a line chart does not need a zero baseline), labelled below.
  const yMin = Math.max(0, Math.floor((Math.min(...values) - 0.01) * 50) / 50);
  const last = data[data.length - 1];
  const lastDay = last?.testDay;
  const span = 1 - yMin;
  const endValues: Partial<Record<Ion, number>> = {};
  for (const ion of IONS) {
    const value = last?.[ion];
    if (typeof value === "number") endValues[ion] = value;
  }
  const labelValues = spreadLabels(endValues, (13 / PLOT_HEIGHT) * span, yMin, 1);

  return (
    <figure>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
        {IONS.map((ion) => (
          <li key={ion} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full" style={{ background: ION_COLORS[ion] }} />
            {ion} {ION_SYMBOLS[ion]}
          </li>
        ))}
      </ul>
      <LineChart
        responsive
        data={data}
        margin={{ top: MARGIN_TOP, right: 44, bottom: 0, left: 0 }}
        style={{ width: "100%", height: CHART_HEIGHT }}
        accessibilityLayer
      >
        <CartesianGrid vertical={false} stroke="var(--gridline)" />
        <XAxis
          dataKey="testDay"
          tickFormatter={(day: number) => `Day ${day}`}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--rule-strong)" }}
          padding={{ left: 12, right: 12 }}
          height={X_AXIS_HEIGHT}
        />
        <YAxis
          domain={[yMin, 1]}
          tickFormatter={(value: number) => formatPercent(value, 0)}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: "var(--rule-strong)" }}
          content={(props: TooltipContentProps) => <DayTooltip {...props} />}
        />
        {IONS.map((ion) => (
          <Line
            key={ion}
            dataKey={ion}
            name={ion}
            type="linear"
            stroke={ION_COLORS[ion]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)", fill: ION_COLORS[ion] }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface)" }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={ion}
              content={(props) => {
                const { x, y, index } = props;
                const actual = endValues[ion];
                const placed = labelValues[ion];
                if (data[Number(index)]?.testDay !== lastDay || actual == null || placed == null) {
                  return null;
                }
                const offset = ((actual - placed) / span) * PLOT_HEIGHT;
                return (
                  <text
                    x={Number(x) + 10}
                    y={Number(y) + offset + 4}
                    fontSize={11}
                    fill="var(--ink-secondary)"
                  >
                    {ION_SYMBOLS[ion]}
                  </text>
                );
              }}
            />
          </Line>
        ))}
      </LineChart>
      <figcaption className="mt-1 text-xs text-ink-muted">
        Axis starts at {Math.round(yMin * 100)}%.
      </figcaption>
    </figure>
  );
}

function DayTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <ChartTooltip title={`Test day ${label}`}>
      {IONS.map((ion) => {
        const entry = payload.find((p) => p.dataKey === ion);
        if (!entry) return null;
        return (
          <TooltipRow
            key={ion}
            label={ion}
            swatch={ION_COLORS[ion]}
            value={formatPercent(typeof entry.value === "number" ? entry.value : null)}
          />
        );
      })}
    </ChartTooltip>
  );
}
