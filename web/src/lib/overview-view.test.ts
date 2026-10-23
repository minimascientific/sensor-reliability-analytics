import { describe, expect, it } from "vitest";
import { lowestYieldLots } from "@/components/overview/lots-to-review";
import type { LotYield } from "@/lib/queries/overview";
import { toLotYieldPoints, toReliabilityDayPoints } from "./overview-view";

function lot(lotId: string, passing: number, tested: number): LotYield {
  return {
    lotId,
    productionDate: "2026-01-01",
    assemblyLine: "Line A",
    shift: "Day",
    materialBatch: "MB",
    sensorBatch: "SB",
    devices: tested,
    devicesTestedAllStages: tested,
    devicesPassingAllStages: passing,
  };
}

describe("toLotYieldPoints", () => {
  it("computes each lot's yield and keeps null for untested lots", () => {
    const points = toLotYieldPoints([lot("L01", 3, 4), lot("L02", 0, 0)]);
    expect(points.map((p) => [p.lotId, p.yield])).toEqual([
      ["L01", 0.75],
      ["L02", null],
    ]);
  });
});

describe("toReliabilityDayPoints", () => {
  it("pivots to one row per day, sorted, ignoring unknown ion names", () => {
    expect(
      toReliabilityDayPoints([
        { testDay: 2, ion: "Sodium", records: 4, passingRecords: 3 },
        { testDay: 1, ion: "Sodium", records: 4, passingRecords: 4 },
        { testDay: 1, ion: "Calcium", records: 2, passingRecords: 1 },
        { testDay: 1, ion: "Lithium", records: 1, passingRecords: 1 },
      ]),
    ).toEqual([
      { testDay: 1, Sodium: 1, Calcium: 0.5 },
      { testDay: 2, Sodium: 0.75 },
    ]);
  });
});

describe("lowestYieldLots", () => {
  it("returns the lowest-yield tested lots, breaking ties by lot ID", () => {
    const lots = [lot("L01", 9, 10), lot("L03", 5, 10), lot("L02", 5, 10), lot("L04", 0, 0)];
    expect(lowestYieldLots(lots, 2).map((l) => l.lotId)).toEqual(["L02", "L03"]);
  });
});
