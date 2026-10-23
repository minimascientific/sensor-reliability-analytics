/**
 * Domain constants and metric helpers.
 *
 * Definitions follow docs/DATA_VERIFICATION.md section 5. Every pass rate is
 * derived from integer counts so the numerator and denominator can always be
 * shown next to the percentage.
 */

/** The verified `pass_fail` value for a passing record (Q4: only "Pass" | "Fail"). */
export const PASS_VALUE = "Pass";

export const STAGES = ["characterization", "reliability", "environmental"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  characterization: "Characterization",
  reliability: "Reliability",
  environmental: "Environmental",
};

/** Ion types present in the dataset (Q4), with display symbols. */
export const IONS = ["Calcium", "Chloride", "Potassium", "Sodium"] as const;
export type Ion = (typeof IONS)[number];

export const ION_SYMBOLS: Record<Ion, string> = {
  Calcium: "Ca²⁺",
  Chloride: "Cl⁻",
  Potassium: "K⁺",
  Sodium: "Na⁺",
};

export function isIon(value: string): value is Ion {
  return (IONS as readonly string[]).includes(value);
}

/** A fraction in [0, 1], or null when the denominator is zero. */
export function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

export interface Ratio {
  numerator: number;
  denominator: number;
  value: number | null;
}

export function ratio(numerator: number, denominator: number): Ratio {
  return { numerator, denominator, value: rate(numerator, denominator) };
}
