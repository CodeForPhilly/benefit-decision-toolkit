import { describe, expect, it } from "vitest";
import { normalizeForComparison } from "./normalizeForComparison";

describe("normalizeForComparison", () => {
  it("ignores case and surrounding whitespace", () => {
    expect(normalizeForComparison("  SNAP Benefits ")).toBe(
      normalizeForComparison("snap benefits"),
    );
  });

  it("treats a missing name as an empty string", () => {
    expect(normalizeForComparison(null)).toBe("");
    expect(normalizeForComparison(undefined)).toBe("");
  });
});
