import { describe, expect, it } from "vitest";
import { spreadLabels } from "./label-layout";

describe("spreadLabels", () => {
  it("leaves well-separated labels where they are", () => {
    expect(spreadLabels({ a: 0.9, b: 0.5 }, 0.05, 0, 1)).toEqual({ a: 0.9, b: 0.5 });
  });

  it("pushes colliding labels apart by at least the gap, keeping order", () => {
    const out = spreadLabels({ a: 0.988, b: 0.987, c: 0.9865 }, 0.001, 0.9, 1);
    expect(out.a).toBeCloseTo(0.988);
    expect(out.b).toBeCloseTo(0.987);
    expect(out.c).toBeCloseTo(0.986);
  });

  it("keeps the stack inside the axis range", () => {
    const out = spreadLabels({ a: 0.901, b: 0.9 }, 0.01, 0.9, 1);
    expect(out.b).toBeGreaterThanOrEqual(0.9 - 1e-9);
    expect(out.a! - out.b!).toBeGreaterThanOrEqual(0.01 - 1e-9);
  });
});
