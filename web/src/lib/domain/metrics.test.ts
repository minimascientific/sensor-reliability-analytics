import { describe, expect, it } from "vitest";
import { isIon, rate, ratio } from "./metrics";

describe("rate", () => {
  it("divides counts", () => {
    expect(rate(3, 4)).toBe(0.75);
  });

  it("returns null instead of NaN for an empty denominator", () => {
    expect(rate(0, 0)).toBeNull();
  });
});

describe("ratio", () => {
  it("keeps the numerator and denominator alongside the value", () => {
    expect(ratio(1, 6)).toEqual({ numerator: 1, denominator: 6, value: 1 / 6 });
  });
});

describe("isIon", () => {
  it("accepts the four verified ion names only", () => {
    expect(isIon("Sodium")).toBe(true);
    expect(isIon("sodium")).toBe(false);
    expect(isIon("Lithium")).toBe(false);
  });
});
