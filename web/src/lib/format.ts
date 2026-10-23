const integer = new Intl.NumberFormat("en-US");

export function formatInt(value: number): string {
  return integer.format(value);
}

/** Format a fraction in [0, 1] as a percentage. Null (no denominator) renders as an en dash. */
export function formatPercent(value: number | null, digits = 1): string {
  if (value === null) return "–";
  return `${(value * 100).toFixed(digits)}%`;
}

/** "8,812 of 10,000" */
export function formatFraction(numerator: number, denominator: number): string {
  return `${formatInt(numerator)} of ${formatInt(denominator)}`;
}
