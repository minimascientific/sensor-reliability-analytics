import { describe, expect, it } from "vitest";
import { formatFraction, formatInt, formatPercent } from "./format";

describe("format", () => {
  it("groups thousands", () => {
    expect(formatInt(240000)).toBe("240,000");
  });

  it("formats fractions as percentages", () => {
    expect(formatPercent(0.96768)).toBe("96.8%");
    expect(formatPercent(0.96768, 2)).toBe("96.77%");
  });

  it("shows an en dash when there is no denominator", () => {
    expect(formatPercent(null)).toBe("–");
  });

  it("states numerator and denominator", () => {
    expect(formatFraction(8812, 10000)).toBe("8,812 of 10,000");
  });
});
