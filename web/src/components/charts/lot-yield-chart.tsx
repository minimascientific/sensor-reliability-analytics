"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { formatFraction, formatPercent } from "@/lib/format";
import { ChartTooltip, TooltipRow } from "./chart-tooltip";

export interface LotYieldPoint {
  lotId: string;
  productionDate: string;
  assemblyLine: string;
  shift: string;
  passing: number;
  tested: number;
  /** null when no device in the lot was tested in all stages. */
  yield: number | null;
}

interface LotYieldChartProps {
  data: LotYieldPoint[];
  overallYield: number | null;
}

const AXIS_TICK = { fill: "var(--ink-muted)", fontSize: 11 };

export function LotYieldChart({ data, overallYield }: LotYieldChartProps) {
  return (
    <figure>
      {overallYield !== null ? (
        <p className="mb-2 flex items-center gap-2 text-xs text-ink-secondary">
          <span aria-hidden="true" className="w-5 border-t-2 border-dashed border-ink-secondary" />
          All lots: {formatPercent(overallYield)}
        </p>
      ) : null}
    <BarChart
      responsive
      data={data}
      margin={{ top: 16, right: 8, bottom: 0, left: 0 }}
      style={{ width: "100%", height: 280 }}
      accessibilityLayer
    >
      <CartesianGrid vertical={false} stroke="var(--gridline)" />
      <XAxis
        dataKey="lotId"
        tick={AXIS_TICK}
        tickLine={false}
        axisLine={{ stroke: "var(--rule-strong)" }}
        interval="preserveStartEnd"
        minTickGap={6}
        height={28}
      />
      <YAxis
        domain={[0, 1]}
        ticks={[0, 0.25, 0.5, 0.75, 1]}
        tickFormatter={(value: number) => formatPercent(value, 0)}
        tick={AXIS_TICK}
        tickLine={false}
        axisLine={false}
        width={44}
      />
      <Tooltip
        cursor={{ fill: "var(--surface-sunken)" }}
        content={(props: TooltipContentProps) => <LotTooltip {...props} />}
      />
      {overallYield !== null ? (
        <ReferenceLine
          y={overallYield}
          stroke="var(--ink-secondary)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          ifOverflow="extendDomain"
        />
      ) : null}
      <Bar
        dataKey="yield"
        name="Rolled throughput yield"
        fill="var(--measure)"
        radius={[4, 4, 0, 0]}
        maxBarSize={28}
        isAnimationActive={false}
      />
    </BarChart>
    </figure>
  );
}

function LotTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as LotYieldPoint | undefined;
  if (!active || !point) return null;
  return (
    <ChartTooltip title={`Lot ${point.lotId}`}>
      <TooltipRow label="Rolled throughput yield" value={formatPercent(point.yield)} />
      <TooltipRow label="Devices passing" value={formatFraction(point.passing, point.tested)} />
      <TooltipRow label="Produced" value={point.productionDate} />
      <TooltipRow label="Line, shift" value={`${point.assemblyLine}, ${point.shift}`} />
    </ChartTooltip>
  );
}
