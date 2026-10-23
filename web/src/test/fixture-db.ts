import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * Helpers for building an in-process Postgres (PGlite) database with the same
 * schema as Supabase. Used by tests and by the local preview database.
 *
 * The schema comes from the repository's documented snapshot,
 * db/schema.sql, so tests exercise the documented table definitions.
 */

export const SCHEMA_PATH = path.resolve(__dirname, "../../../db/schema.sql");

export interface LotRow {
  lot_id: string;
  production_date: string;
  assembly_line: string;
  shift: string;
  material_batch: string;
  sensor_batch: string;
  manufacturing_operator: string;
}

export interface DeviceRow {
  device_id: string;
  lot_id: string;
  manufacture_timestamp: string;
  device_status: string;
}

export interface StationRow {
  test_station_id: string;
  station_name: string;
  station_type: string;
  software_version: string;
  calibration_date: string;
}

export interface CharacterizationRow {
  characterization_test_id: string;
  device_id: string;
  test_station_id: string;
  ion_type: string;
  reference_value: number;
  measured_value: number;
  measurement_error: number;
  noise: number | null;
  sensitivity: number | null;
  calibration_offset: number | null;
  test_timestamp: string;
  pass_fail: string;
}

export interface ReliabilityRow {
  reliability_test_id: string;
  device_id: string;
  test_station_id: string;
  test_day: number;
  ion_type: string;
  drift: number | null;
  measurement_error: number | null;
  sensitivity_change: number | null;
  pass_fail: string;
  failure_mode: string | null;
  test_timestamp: string;
}

export interface EnvironmentalRow {
  environmental_test_id: string;
  device_id: string;
  test_station_id: string;
  stress_profile: string;
  temperature: number;
  humidity: number;
  cycle_count: number | null;
  test_duration_hours: number | null;
  post_test_error: number | null;
  pass_fail: string;
  test_timestamp: string;
}

export interface FixtureData {
  lots: LotRow[];
  devices: DeviceRow[];
  stations: StationRow[];
  characterization: CharacterizationRow[];
  reliability: ReliabilityRow[];
  environmental: EnvironmentalRow[];
}

async function insertRows(db: PGlite, table: string, rows: object[]): Promise<void> {
  if (rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const batchSize = Math.max(1, Math.floor(30_000 / columns.length));
  for (let start = 0; start < rows.length; start += batchSize) {
    const batch = rows.slice(start, start + batchSize);
    const params: unknown[] = [];
    const tuples = batch.map((row) => {
      const values = row as Record<string, unknown>;
      const placeholders = columns.map((column) => {
        params.push(values[column]);
        return `$${params.length}`;
      });
      return `(${placeholders.join(", ")})`;
    });
    await db.query(
      `insert into ${table} (${columns.join(", ")}) values ${tuples.join(", ")}`,
      params,
    );
  }
}

/** Create a PGlite database with the documented schema and the given rows. */
export async function createFixtureDatabase(data: FixtureData): Promise<PGlite> {
  const db = await PGlite.create();
  await db.exec(readFileSync(SCHEMA_PATH, "utf8"));
  await insertRows(db, "production_lots", data.lots);
  await insertRows(db, "devices", data.devices);
  await insertRows(db, "test_stations", data.stations);
  await insertRows(db, "characterization_tests", data.characterization);
  await insertRows(db, "reliability_tests", data.reliability);
  await insertRows(db, "environmental_tests", data.environmental);
  return db;
}
