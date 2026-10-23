/**
 * Spread end-of-line labels so they never overlap.
 *
 * Takes each label's data value and returns a display value, moved apart so
 * neighbouring labels are at least `minGap` (in data units) apart, kept inside
 * [min, max], and kept in the same vertical order as the data.
 */
export function spreadLabels<K extends string>(
  values: Partial<Record<K, number>>,
  minGap: number,
  min: number,
  max: number,
): Partial<Record<K, number>> {
  const entries = (Object.entries(values) as [K, number][])
    .filter(([, v]) => typeof v === "number")
    .sort((a, b) => b[1] - a[1]); // highest first

  const placed = entries.map(([, v]) => Math.min(v, max));
  for (let i = 1; i < placed.length; i++) {
    placed[i] = Math.min(placed[i], placed[i - 1] - minGap);
  }
  // If the bottom label fell below the axis, push the stack back up.
  const overflow = min - placed[placed.length - 1];
  if (placed.length > 0 && overflow > 0) {
    for (let i = placed.length - 1; i >= 0; i--) {
      placed[i] += overflow;
      if (i > 0 && placed[i - 1] - placed[i] >= minGap) break;
      if (i > 0) placed[i - 1] = Math.max(placed[i - 1], placed[i] + minGap);
    }
  }

  const result: Partial<Record<K, number>> = {};
  entries.forEach(([key], i) => {
    result[key] = placed[i];
  });
  return result;
}
