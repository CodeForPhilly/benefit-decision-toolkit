import { describe, expect, it } from "vitest";

import { YesNoQuestion } from "./YesNoQuestion";

describe("YesNoQuestion", () => {
  it("preserves boolean answers when form-js reimports form data", () => {
    const sanitizeValue = YesNoQuestion.config.sanitizeValue;

    expect(sanitizeValue({ value: true })).toBe(true);
    expect(sanitizeValue({ value: false })).toBe(false);
    expect(sanitizeValue({ value: "true" })).toBeNull();
    expect(sanitizeValue({ value: null })).toBeNull();
  });
});
