import { IONS } from "@/lib/domain/metrics";
import type {
  CharacterizationRow,
  DeviceRow,
  EnvironmentalRow,
  FixtureData,
  ReliabilityRow,
} from "./fixture-db";

/**
 * A tiny hand-designed dataset whose expected metrics are worked out by hand
 * below, so query results can be checked against known answers.
 *
 * Shape (mirrors the verified grain, at small scale):
 *   L01: D001–D004       L02: D005–D007       L03: no devices
 *   Characterization: every device × 4 ions (D007 included)
 *   Reliability:      D001–D006 × 4 ions × test days 1–2   (D007 missing)
 *   Environmental:    D001–D006 × 4 stress profiles        (D007 missing)
 *
 * Failures:
 *   Characterization: D002 Potassium, D005 Sodium
 *   Reliability:      D003 Calcium day 2, D003 Chloride day 2, D006 Sodium day 1
 *   Environmental:    D004 High Humidity
 *
 * Passing records carry a failure_mode on purpose, mirroring the open data
 * issue, to prove the queries ignore that column.
 */

const CHAR_FAILURES = new Set(["D002|Potassium", "D005|Sodium"]);
const REL_FAILURES = new Set(["D003|Calcium|2", "D003|Chloride|2", "D006|Sodium|1"]);
const ENV_FAILURES = new Set(["D004|High Humidity"]);

const STRESS_PROFILES = ["Baseline", "High Humidity", "High Temperature", "Thermal Cycling"];
const TEST_DAYS = [1, 2];

function devicesFor(lotId: string, ids: string[]): DeviceRow[] {
  return ids.map((id) => ({
    device_id: id,
    lot_id: lotId,
    manufacture_timestamp: "2026-01-10 08:00:00",
    device_status: "Active",
  }));
}

export function buildSmallFixture(): FixtureData {
  const devices = [
    ...devicesFor("L01", ["D001", "D002", "D003", "D004"]),
    ...devicesFor("L02", ["D005", "D006", "D007"]),
  ];

  const characterization: CharacterizationRow[] = [];
  for (const device of devices) {
    for (const ion of IONS) {
      characterization.push({
        characterization_test_id: `C-${device.device_id}-${ion}`,
        device_id: device.device_id,
        test_station_id: "CHR-1",
        ion_type: ion,
        reference_value: 4,
        measured_value: 4.01,
        measurement_error: 0.01,
        noise: 0.002,
        sensitivity: 58.9,
        calibration_offset: 0.001,
        test_timestamp: "2026-01-12 09:00:00",
        pass_fail: CHAR_FAILURES.has(`${device.device_id}|${ion}`) ? "Fail" : "Pass",
      });
    }
  }

  const reliability: ReliabilityRow[] = [];
  const environmental: EnvironmentalRow[] = [];
  for (const device of devices.filter((d) => d.device_id !== "D007")) {
    for (const ion of IONS) {
      for (const day of TEST_DAYS) {
        const failed = REL_FAILURES.has(`${device.device_id}|${ion}|${day}`);
        reliability.push({
          reliability_test_id: `R-${device.device_id}-${ion}-${day}`,
          device_id: device.device_id,
          test_station_id: "REL-1",
          test_day: day,
          ion_type: ion,
          drift: 0.01,
          measurement_error: 0.02,
          sensitivity_change: -0.1,
          pass_fail: failed ? "Fail" : "Pass",
          // Deliberately inconsistent with pass_fail, like the real data.
          failure_mode: device.device_id === "D001" ? "Calibration Drift" : null,
          test_timestamp: `2026-01-${String(12 + day).padStart(2, "0")} 09:00:00`,
        });
      }
    }
    for (const profile of STRESS_PROFILES) {
      environmental.push({
        environmental_test_id: `E-${device.device_id}-${profile}`,
        device_id: device.device_id,
        test_station_id: "ENV-1",
        stress_profile: profile,
        temperature: 25,
        humidity: 50,
        cycle_count: 10,
        test_duration_hours: 48,
        post_test_error: 0.03,
        pass_fail: ENV_FAILURES.has(`${device.device_id}|${profile}`) ? "Fail" : "Pass",
        test_timestamp: "2026-01-20 09:00:00",
      });
    }
  }

  return {
    lots: ["L01", "L02", "L03"].map((lotId, i) => ({
      lot_id: lotId,
      production_date: `2026-01-0${i + 1}`,
      assembly_line: i === 1 ? "Line B" : "Line A",
      shift: "Day",
      material_batch: `MB-${i + 1}`,
      sensor_batch: `SB-${i + 1}`,
      manufacturing_operator: `OP-${i + 1}`,
    })),
    devices,
    stations: [
      ["CHR-1", "Characterization"],
      ["CHR-2", "Characterization"],
      ["REL-1", "Reliability"],
      ["REL-2", "Reliability"],
      ["ENV-1", "Environmental"],
      ["ENV-2", "Environmental"],
    ].map(([id, type]) => ({
      test_station_id: id,
      station_name: `${type} ${id.slice(-1)}`,
      station_type: type,
      software_version: "1.0.0",
      calibration_date: "2026-01-01",
    })),
    characterization,
    reliability,
    environmental,
  };
}
