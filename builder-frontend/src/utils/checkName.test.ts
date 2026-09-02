import { describe, expect, it } from "vitest";

import { checkNameError } from "./checkName";

describe("checkNameError", () => {
  it.each([
    "Owns and occupies home",
    "Applicant's income",
    "Age-18 check",
    "Age_18 check",
    "Has SNAP",
    "Check 2",
    "Über check",
    "Formal address",
  ])("accepts %s", (name) => {
    expect(checkNameError(name)).toBeNull();
  });

  it("rejects a name that does not start with a letter", () => {
    expect(checkNameError("2024 income")).toBe(
      "Check name must start with a letter and use only letters, numbers," +
        " spaces, apostrophes, hyphens and underscores.",
    );
  });

  it.each([
    "Income > $50k",
    "Income (annual)",
    "Income, adjusted",
    "Owns home!",
  ])("rejects %s, which FEEL cannot parse", (name) => {
    expect(checkNameError(name)).not.toBeNull();
  });

  it("rejects a name starting with a reserved word", () => {
    expect(checkNameError("for-profit employment")).toBe(
      'Check name cannot start with "for", which is a reserved word in decision models.',
    );
    expect(checkNameError("if income is low")).not.toBeNull();
  });

  it("rejects a blank name", () => {
    expect(checkNameError("   ")).toBe("Check name must be provided.");
  });
});
