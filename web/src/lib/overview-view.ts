import type { LotYieldPoint } from "@/components/charts/lot-yield-chart";
import type { ReliabilityDayPoint } from "@/components/charts/reliability-day-chart";
import { isIon, rate } from "@/lib/domain/metrics";
import type { LotYield, ReliabilityDayPassRate } from "@/lib/queries/overview";

/** Shape lot yields for the lot chart. */
export function toLotYieldPoints(lots: LotYield[]): LotYieldPoint[] {
  return lots.map((lot) => ({
    lotId: lot.lotId,
    productionDate: lot.productionDate,
    assemblyLine: lot.assemblyLine,
    shift: lot.shift,
    passing: lot.devicesPassingAllStages,
    tested: lot.devicesTestedAllStages,
    yield: rate(lot.devicesPassingAllStages, lot.devicesTestedAllStages),
  }));
}

/** Pivot (test day, ion) rows into one row per day with a pass rate per ion. Unknown ions are ignored. */
export function toReliabilityDayPoints(rows: ReliabilityDayPassRate[]): ReliabilityDayPoint[] {
  const byDay = new Map<number, ReliabilityDayPoint>();
  for (const row of rows) {
    if (!isIon(row.ion)) continue;
    const point = byDay.get(row.testDay) ?? { testDay: row.testDay };
    point[row.ion] = rate(row.passingRecords, row.records);
    byDay.set(row.testDay, point);
  }
  return [...byDay.values()].sort((a, b) => a.testDay - b.testDay);
}
