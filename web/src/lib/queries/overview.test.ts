import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Queryable } from "@/lib/db/types";
import { createFixtureDatabase } from "@/test/fixture-db";
import { buildSmallFixture } from "@/test/small-fixture";
import {
  OVERVIEW_SQL,
  getDatasetCounts,
  getExecutiveOverview,
  getIonPassRates,
  getLotYields,
  getReliabilityByTestDay,
  getStagePassRates,
  summarizeThroughput,
} from "./overview";

// Expected values are worked out by hand from the design in small-fixture.ts.

let pg: PGlite;
let db: Queryable;

beforeAll(async () => {
  pg = await createFixtureDatabase(buildSmallFixture());
  db = pg;
});

afterAll(async () => {
  await pg.close();
});

describe("getDatasetCounts", () => {
  it("counts every table", async () => {
    expect(await getDatasetCounts(db)).toEqual({
      lots: 3,
      devices: 7,
      stations: 6,
      records: { characterization: 28, reliability: 48, environmental: 24 },
    });
  });
});

describe("getStagePassRates", () => {
  it("separates record-level and device-level outcomes", async () => {
    expect(await getStagePassRates(db)).toEqual([
      // 7 devices × 4 ions; D002 and D005 each fail one ion.
      { stage: "characterization", records: 28, passingRecords: 26, devices: 7, passingDevices: 5 },
      // D003 fails two records but counts as one failing device; D006 fails one.
      { stage: "reliability", records: 48, passingRecords: 45, devices: 6, passingDevices: 4 },
      // D004 fails High Humidity.
      { stage: "environmental", records: 24, passingRecords: 23, devices: 6, passingDevices: 5 },
    ]);
  });

  it("uses only devices tested in a stage as that stage's device denominator", async () => {
    const rates = await getStagePassRates(db);
    // D007 has characterization records only.
    expect(rates.find((r) => r.stage === "reliability")?.devices).toBe(6);
    expect(rates.find((r) => r.stage === "characterization")?.devices).toBe(7);
  });
});

describe("getLotYields / summarizeThroughput", () => {
  it("computes rolled throughput yield per lot over devices tested in all stages", async () => {
    const lots = await getLotYields(db);
    expect(
      lots.map(({ lotId, devices, devicesTestedAllStages, devicesPassingAllStages }) => ({
        lotId,
        devices,
        devicesTestedAllStages,
        devicesPassingAllStages,
      })),
    ).toEqual([
      // Only D001 passes everything.
      { lotId: "L01", devices: 4, devicesTestedAllStages: 4, devicesPassingAllStages: 1 },
      // D007 lacks reliability and environmental records, so it is excluded from the denominator.
      { lotId: "L02", devices: 3, devicesTestedAllStages: 2, devicesPassingAllStages: 0 },
      // A lot with no devices still appears, with zero counts.
      { lotId: "L03", devices: 0, devicesTestedAllStages: 0, devicesPassingAllStages: 0 },
    ]);
  });

  it("returns lot attributes and ISO production dates", async () => {
    const [first] = await getLotYields(db);
    expect(first).toMatchObject({
      productionDate: "2026-01-01",
      assemblyLine: "Line A",
      materialBatch: "MB-1",
      sensorBatch: "SB-1",
    });
  });

  it("sums lots into the overall yield", async () => {
    expect(summarizeThroughput(await getLotYields(db))).toEqual({
      devices: 7,
      devicesTestedAllStages: 6,
      devicesPassingAllStages: 1,
    });
  });
});

describe("getIonPassRates", () => {
  it("reports per-ion record and device outcomes for both ion-level stages", async () => {
    expect(await getIonPassRates(db)).toEqual([
      { stage: "characterization", ion: "Calcium", records: 7, passingRecords: 7, devices: 7, passingDevices: 7 },
      { stage: "characterization", ion: "Chloride", records: 7, passingRecords: 7, devices: 7, passingDevices: 7 },
      { stage: "characterization", ion: "Potassium", records: 7, passingRecords: 6, devices: 7, passingDevices: 6 },
      { stage: "characterization", ion: "Sodium", records: 7, passingRecords: 6, devices: 7, passingDevices: 6 },
      { stage: "reliability", ion: "Calcium", records: 12, passingRecords: 11, devices: 6, passingDevices: 5 },
      { stage: "reliability", ion: "Chloride", records: 12, passingRecords: 11, devices: 6, passingDevices: 5 },
      { stage: "reliability", ion: "Potassium", records: 12, passingRecords: 12, devices: 6, passingDevices: 6 },
      { stage: "reliability", ion: "Sodium", records: 12, passingRecords: 11, devices: 6, passingDevices: 5 },
    ]);
  });
});

describe("getReliabilityByTestDay", () => {
  it("groups reliability records by test day and ion", async () => {
    const rows = await getReliabilityByTestDay(db);
    expect(rows).toHaveLength(8);
    const passing = Object.fromEntries(
      rows.map((r) => [`${r.testDay}|${r.ion}`, `${r.passingRecords}/${r.records}`]),
    );
    expect(passing).toEqual({
      "1|Calcium": "6/6",
      "1|Chloride": "6/6",
      "1|Potassium": "6/6",
      "1|Sodium": "5/6",
      "2|Calcium": "5/6",
      "2|Chloride": "5/6",
      "2|Potassium": "6/6",
      "2|Sodium": "6/6",
    });
  });
});

describe("getExecutiveOverview", () => {
  it("assembles every section", async () => {
    const overview = await getExecutiveOverview(db);
    expect(overview.counts.devices).toBe(7);
    expect(overview.stagePassRates).toHaveLength(3);
    expect(overview.lotYields).toHaveLength(3);
    expect(overview.throughput.devicesPassingAllStages).toBe(1);
    expect(overview.ionPassRates).toHaveLength(8);
    expect(overview.reliabilityByDay).toHaveLength(8);
  });
});

describe("data-verification guardrails", () => {
  // docs/DATA_VERIFICATION.md: failure_mode is an open issue and device_status
  // is uninformative, so neither may feed Executive Overview metrics.
  it.each(["failure_mode", "device_status"])("never queries %s", (column) => {
    for (const sql of OVERVIEW_SQL) {
      expect(sql).not.toContain(column);
    }
  });
});
