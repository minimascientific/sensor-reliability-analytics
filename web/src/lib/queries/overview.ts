import "server-only";
import type { Queryable } from "@/lib/db/types";
import { PASS_VALUE, STAGES, type Stage } from "@/lib/domain/metrics";

/*
 * Executive Overview queries.
 *
 * Only verified columns are used (docs/DATA_VERIFICATION.md). In particular
 * `failure_mode` (open issue) and `device_status` (always 'Active') are not
 * referenced, and no specification limits are assumed: pass/fail comes only
 * from the stored `pass_fail` values.
 *
 * All aggregation happens in SQL; only small summary rows reach the app. Every
 * count is cast to int so results are plain numbers rather than bigint strings.
 */

// ---------------------------------------------------------------------------
// Dataset counts
// ---------------------------------------------------------------------------

export interface DatasetCounts {
  lots: number;
  devices: number;
  stations: number;
  records: Record<Stage, number>;
}

const DATASET_COUNTS_SQL = `
select
  (select count(*)::int from production_lots)        as lots,
  (select count(*)::int from devices)                as devices,
  (select count(*)::int from test_stations)          as stations,
  (select count(*)::int from characterization_tests) as characterization_records,
  (select count(*)::int from reliability_tests)      as reliability_records,
  (select count(*)::int from environmental_tests)    as environmental_records
`;

export async function getDatasetCounts(db: Queryable): Promise<DatasetCounts> {
  const { rows } = await db.query<{
    lots: number;
    devices: number;
    stations: number;
    characterization_records: number;
    reliability_records: number;
    environmental_records: number;
  }>(DATASET_COUNTS_SQL);
  const row = rows[0];
  return {
    lots: row.lots,
    devices: row.devices,
    stations: row.stations,
    records: {
      characterization: row.characterization_records,
      reliability: row.reliability_records,
      environmental: row.environmental_records,
    },
  };
}

// ---------------------------------------------------------------------------
// Pass rates per stage: per record and per device
// ---------------------------------------------------------------------------

export interface StagePassRate {
  stage: Stage;
  records: number;
  passingRecords: number;
  /** Devices with at least one record in this stage. */
  devices: number;
  /** Devices whose records in this stage all pass. */
  passingDevices: number;
}

const STAGE_PASS_RATES_SQL = `
with per_device as (
  select 'characterization' as stage, device_id,
         count(*) as records,
         count(*) filter (where pass_fail = $1) as passing
  from characterization_tests group by device_id
  union all
  select 'reliability', device_id,
         count(*), count(*) filter (where pass_fail = $1)
  from reliability_tests group by device_id
  union all
  select 'environmental', device_id,
         count(*), count(*) filter (where pass_fail = $1)
  from environmental_tests group by device_id
)
select stage,
       sum(records)::int                                as records,
       sum(passing)::int                                as passing_records,
       count(*)::int                                    as devices,
       count(*) filter (where passing = records)::int   as passing_devices
from per_device
group by stage
`;

export async function getStagePassRates(db: Queryable): Promise<StagePassRate[]> {
  const { rows } = await db.query<{
    stage: Stage;
    records: number;
    passing_records: number;
    devices: number;
    passing_devices: number;
  }>(STAGE_PASS_RATES_SQL, [PASS_VALUE]);

  const byStage = new Map(rows.map((row) => [row.stage, row]));
  // Always return all three stages in pipeline order, even if one is empty.
  return STAGES.map((stage) => {
    const row = byStage.get(stage);
    return {
      stage,
      records: row?.records ?? 0,
      passingRecords: row?.passing_records ?? 0,
      devices: row?.devices ?? 0,
      passingDevices: row?.passing_devices ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Rolled throughput yield by lot
// ---------------------------------------------------------------------------

export interface LotYield {
  lotId: string;
  /** ISO date, YYYY-MM-DD. */
  productionDate: string;
  assemblyLine: string;
  shift: string;
  materialBatch: string;
  sensorBatch: string;
  devices: number;
  /** Devices with records in all three stages (the yield denominator). */
  devicesTestedAllStages: number;
  /** Of those, devices whose records pass in every stage. */
  devicesPassingAllStages: number;
}

const LOT_YIELD_SQL = `
with stage_outcome as (
  select d.device_id, d.lot_id,
         c.passed as char_passed,
         r.passed as rel_passed,
         e.passed as env_passed
  from devices d
  left join (select device_id, bool_and(pass_fail = $1) as passed
             from characterization_tests group by device_id) c using (device_id)
  left join (select device_id, bool_and(pass_fail = $1) as passed
             from reliability_tests group by device_id) r using (device_id)
  left join (select device_id, bool_and(pass_fail = $1) as passed
             from environmental_tests group by device_id) e using (device_id)
)
select l.lot_id,
       l.production_date::text as production_date,
       l.assembly_line,
       l.shift,
       l.material_batch,
       l.sensor_batch,
       count(o.device_id)::int as devices,
       count(*) filter (where o.char_passed is not null
                          and o.rel_passed is not null
                          and o.env_passed is not null)::int as devices_tested_all_stages,
       count(*) filter (where o.char_passed and o.rel_passed and o.env_passed)::int
         as devices_passing_all_stages
from production_lots l
left join stage_outcome o using (lot_id)
group by l.lot_id
order by l.lot_id
`;

export async function getLotYields(db: Queryable): Promise<LotYield[]> {
  const { rows } = await db.query<{
    lot_id: string;
    production_date: string;
    assembly_line: string;
    shift: string;
    material_batch: string;
    sensor_batch: string;
    devices: number;
    devices_tested_all_stages: number;
    devices_passing_all_stages: number;
  }>(LOT_YIELD_SQL, [PASS_VALUE]);

  return rows.map((row) => ({
    lotId: row.lot_id,
    productionDate: row.production_date,
    assemblyLine: row.assembly_line,
    shift: row.shift,
    materialBatch: row.material_batch,
    sensorBatch: row.sensor_batch,
    devices: row.devices,
    devicesTestedAllStages: row.devices_tested_all_stages,
    devicesPassingAllStages: row.devices_passing_all_stages,
  }));
}

export interface ThroughputYield {
  devices: number;
  devicesTestedAllStages: number;
  devicesPassingAllStages: number;
}

/** Overall rolled throughput yield. Every device belongs to exactly one lot (validated FK). */
export function summarizeThroughput(lots: LotYield[]): ThroughputYield {
  return lots.reduce(
    (total, lot) => ({
      devices: total.devices + lot.devices,
      devicesTestedAllStages: total.devicesTestedAllStages + lot.devicesTestedAllStages,
      devicesPassingAllStages: total.devicesPassingAllStages + lot.devicesPassingAllStages,
    }),
    { devices: 0, devicesTestedAllStages: 0, devicesPassingAllStages: 0 },
  );
}

// ---------------------------------------------------------------------------
// Pass rates by ion (characterization and reliability have an ion_type)
// ---------------------------------------------------------------------------

export type IonStage = Extract<Stage, "characterization" | "reliability">;

export interface IonPassRate {
  stage: IonStage;
  ion: string;
  records: number;
  passingRecords: number;
  devices: number;
  /** Devices whose records for this ion all pass. */
  passingDevices: number;
}

const ION_PASS_RATES_SQL = `
with per_device_ion as (
  select 'characterization' as stage, ion_type, device_id,
         count(*) as records,
         count(*) filter (where pass_fail = $1) as passing
  from characterization_tests group by ion_type, device_id
  union all
  select 'reliability', ion_type, device_id,
         count(*), count(*) filter (where pass_fail = $1)
  from reliability_tests group by ion_type, device_id
)
select stage,
       ion_type                                         as ion,
       sum(records)::int                                as records,
       sum(passing)::int                                as passing_records,
       count(*)::int                                    as devices,
       count(*) filter (where passing = records)::int   as passing_devices
from per_device_ion
group by stage, ion_type
order by stage, ion_type
`;

export async function getIonPassRates(db: Queryable): Promise<IonPassRate[]> {
  const { rows } = await db.query<{
    stage: IonStage;
    ion: string;
    records: number;
    passing_records: number;
    devices: number;
    passing_devices: number;
  }>(ION_PASS_RATES_SQL, [PASS_VALUE]);

  return rows.map((row) => ({
    stage: row.stage,
    ion: row.ion,
    records: row.records,
    passingRecords: row.passing_records,
    devices: row.devices,
    passingDevices: row.passing_devices,
  }));
}

// ---------------------------------------------------------------------------
// Reliability record pass rate by test day and ion
// ---------------------------------------------------------------------------

export interface ReliabilityDayPassRate {
  testDay: number;
  ion: string;
  records: number;
  passingRecords: number;
}

const RELIABILITY_BY_DAY_SQL = `
select test_day,
       ion_type                                    as ion,
       count(*)::int                               as records,
       count(*) filter (where pass_fail = $1)::int as passing_records
from reliability_tests
group by test_day, ion_type
order by test_day, ion_type
`;

export async function getReliabilityByTestDay(db: Queryable): Promise<ReliabilityDayPassRate[]> {
  const { rows } = await db.query<{
    test_day: number;
    ion: string;
    records: number;
    passing_records: number;
  }>(RELIABILITY_BY_DAY_SQL, [PASS_VALUE]);

  return rows.map((row) => ({
    testDay: row.test_day,
    ion: row.ion,
    records: row.records,
    passingRecords: row.passing_records,
  }));
}

// ---------------------------------------------------------------------------
// Everything the Executive Overview needs, in parallel
// ---------------------------------------------------------------------------

export interface ExecutiveOverview {
  counts: DatasetCounts;
  stagePassRates: StagePassRate[];
  lotYields: LotYield[];
  throughput: ThroughputYield;
  ionPassRates: IonPassRate[];
  reliabilityByDay: ReliabilityDayPassRate[];
}

export async function getExecutiveOverview(db: Queryable): Promise<ExecutiveOverview> {
  const [counts, stagePassRates, lotYields, ionPassRates, reliabilityByDay] = await Promise.all([
    getDatasetCounts(db),
    getStagePassRates(db),
    getLotYields(db),
    getIonPassRates(db),
    getReliabilityByTestDay(db),
  ]);
  return {
    counts,
    stagePassRates,
    lotYields,
    throughput: summarizeThroughput(lotYields),
    ionPassRates,
    reliabilityByDay,
  };
}

/** Exported for tests that guard against unverified columns being used. */
export const OVERVIEW_SQL = [
  DATASET_COUNTS_SQL,
  STAGE_PASS_RATES_SQL,
  LOT_YIELD_SQL,
  ION_PASS_RATES_SQL,
  RELIABILITY_BY_DAY_SQL,
];
