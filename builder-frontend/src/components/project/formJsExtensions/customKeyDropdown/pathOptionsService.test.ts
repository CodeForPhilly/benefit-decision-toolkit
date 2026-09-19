import { describe, expect, it } from "vitest";
import { isTypeCompatible } from "./pathOptionsService";

describe("isTypeCompatible", () => {
  it("offers boolean paths only to components that submit real booleans", () => {
    expect(isTypeCompatible("boolean", "yes_no")).toBe(true);
    expect(isTypeCompatible("boolean", "checkbox")).toBe(true);

    // Checkbox groups, radios, and selects submit strings (or arrays of them).
    expect(isTypeCompatible("boolean", "checklist")).toBe(false);
    expect(isTypeCompatible("boolean", "radio")).toBe(false);
    expect(isTypeCompatible("boolean", "select")).toBe(false);
  });
});
