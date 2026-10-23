import { IONS } from "@/lib/domain/metrics";
import type {
  CharacterizationRow,
  DeviceRow,
  EnvironmentalRow,
  FixtureData,
  LotRow,
  ReliabilityRow,
  StationRow,
} from "./fixture-db";

/**
 * Generated sample data for previewing the UI locally.
 *
 * It follows the verified grain of the real dataset (one characterization
 * record per device × ion, one reliability record per device × ion × test
 * day, one environmental record per device × stress profile), but it is
 * smaller and its pass probabilities are made up. It says nothing about the
 * real Supabase data, and the app labels it as sample data.
 */

/** Deterministic PRNG (mulberry32), so every preview shows the same numbers. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRESS_PROFILES = ["Baseline", "High Humidity", "High Temperature", "Thermal Cycling"] as const;
const TEST_DAYS = [1, 7, 14, 28];
const REFERENCE_VALUES: Record<(typeof IONS)[number], number> = {
  Calcium: 1.25,
  Chloride: 104,
  Potassium: 4.2,
  Sodium: 140,
};

const BASE_CHAR_PASS = { Calcium: 0.988, Chloride: 0.993, Potassium: 0.981, Sodium: 0.986 };
const BASE_REL_PASS = { Calcium: 0.996, Chloride: 0.997, Potassium: 0.994, Sodium: 0.995 };
const ENV_PASS = {
  Baseline: 0.992,
  "High Humidity": 0.962,
  "High Temperature": 0.971,
  "Thermal Cycling": 0.966,
};

export function buildPreviewFixture({ lots = 20, devicesPerLot = 100, seed = 7 } = {}): FixtureData {
  const random = seededRandom(seed);
  const pad = (n: number, width: number) => String(n).padStart(width, "0");

  const stations: StationRow[] = [
    ["CHR-1", "Characterization", "4.2.1", "2026-01-05"],
    ["CHR-2", "Characterization", "4.3.0", "2026-01-19"],
    ["REL-1", "Reliability", "2.8.4", "2026-01-08"],
    ["REL-2", "Reliability", "2.8.4", "2026-02-02"],
    ["ENV-1", "Environmental", "1.6.2", "2026-01-12"],
    ["ENV-2", "Environmental", "1.7.0", "2026-01-26"],
  ].map(([id, type, version, calibrated]) => ({
    test_station_id: id,
    station_name: `${type} station ${id.slice(-1)}`,
    station_type: type,
    software_version: version,
    calibration_date: calibrated,
  }));

  const lotRows: LotRow[] = [];
  const devices: DeviceRow[] = [];
  const characterization: CharacterizationRow[] = [];
  const reliability: ReliabilityRow[] = [];
  const environmental: EnvironmentalRow[] = [];

  for (let l = 0; l < lots; l++) {
    const lotId = `L${pad(l + 1, 2)}`;
    const day = new Date(Date.UTC(2026, 1, 2 + l * 3));
    const date = day.toISOString().slice(0, 10);
    const materialBatch = `MB-${pad((l % 5) + 1, 2)}`;
    const sensorBatch = `SB-${pad((l % 4) + 1, 2)}`;
    lotRows.push({
      lot_id: lotId,
      production_date: date,
      assembly_line: ["Line A", "Line B", "Line C"][l % 3],
      shift: ["Day", "Swing", "Night"][(l * 2) % 3],
      material_batch: materialBatch,
      sensor_batch: sensorBatch,
      manufacturing_operator: `OP-${pad((l % 6) + 1, 2)}`,
    });

    // Made-up lot effects so the charts have something to show.
    const charPenalty = materialBatch === "MB-03" ? 0.02 : 0;
    const relPenalty = sensorBatch === "SB-02" ? 0.006 : 0;

    for (let d = 0; d < devicesPerLot; d++) {
      const deviceId = `D${pad(l * devicesPerLot + d + 1, 5)}`;
      devices.push({
        device_id: deviceId,
        lot_id: lotId,
        manufacture_timestamp: `${date} ${pad(6 + (d % 12), 2)}:${pad(d % 60, 2)}:00`,
        device_status: "Active",
      });

      IONS.forEach((ion, i) => {
        const reference = REFERENCE_VALUES[ion];
        const error = (random() - 0.5) * reference * 0.02;
        characterization.push({
          characterization_test_id: `CT-${deviceId}-${i + 1}`,
          device_id: deviceId,
          test_station_id: d % 2 === 0 ? "CHR-1" : "CHR-2",
          ion_type: ion,
          reference_value: reference,
          measured_value: Number((reference + error).toFixed(4)),
          measurement_error: Number(error.toFixed(4)),
          noise: Number((random() * 0.01).toFixed(4)),
          sensitivity: Number((ion === "Calcium" ? 28.5 + random() : ion === "Chloride" ? -57.5 - random() * 2 : 57.5 + random() * 2).toFixed(2)),
          calibration_offset: Number(((random() - 0.5) * 0.01).toFixed(4)),
          test_timestamp: `${date} 18:00:00`,
          pass_fail: random() < BASE_CHAR_PASS[ion] - charPenalty ? "Pass" : "Fail",
        });

        TEST_DAYS.forEach((testDay, dayIndex) => {
          const passProbability = BASE_REL_PASS[ion] - relPenalty - dayIndex * 0.0025;
          const passed = random() < passProbability;
          reliability.push({
            reliability_test_id: `RT-${deviceId}-${i + 1}-${testDay}`,
            device_id: deviceId,
            test_station_id: d % 2 === 0 ? "REL-1" : "REL-2",
            test_day: testDay,
            ion_type: ion,
            drift: Number((random() * 0.002 * testDay).toFixed(5)),
            measurement_error: Number(((random() - 0.5) * 0.03).toFixed(4)),
            sensitivity_change: Number((-random() * 0.05 * testDay).toFixed(4)),
            pass_fail: passed ? "Pass" : "Fail",
            failure_mode: passed ? null : "Calibration Drift",
            test_timestamp: `${date} 09:00:00`,
          });
        });
      });

      STRESS_PROFILES.forEach((profile, p) => {
        environmental.push({
          environmental_test_id: `ET-${deviceId}-${p + 1}`,
          device_id: deviceId,
          test_station_id: d % 2 === 0 ? "ENV-1" : "ENV-2",
          stress_profile: profile,
          temperature: profile === "High Temperature" ? 45 : profile === "Thermal Cycling" ? 5 : 25,
          humidity: profile === "High Humidity" ? 90 : 45,
          cycle_count: profile === "Thermal Cycling" ? 200 : null,
          test_duration_hours: 168,
          post_test_error: Number(((random() - 0.5) * 0.05).toFixed(4)),
          pass_fail: random() < ENV_PASS[profile] ? "Pass" : "Fail",
          test_timestamp: `${date} 12:00:00`,
        });
      });
    }
  }

  return { lots: lotRows, devices, stations, characterization, reliability, environmental };
}
