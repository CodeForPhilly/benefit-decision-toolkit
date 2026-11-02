import { describe, expect, it } from "vitest";

import { checkDisplayName } from "./checkDisplayName";

describe("checkDisplayName", () => {
  it.each([
    ["incomeLimit", "Income Limit"],
    ["PrimaryResidenceRequirement", "Primary Residence Requirement"],
    ["income_limit", "Income limit"],
  ])("spaces out the identifier %s", (aliasName, displayName) => {
    expect(checkDisplayName({ aliasName, name: "OriginalCheck" })).toBe(
      displayName,
    );
  });

  it.each([
    "Age 18-64",
    "Income $1,000-$2,000",
    "Non-citizen",
    "iPhone",
    "income limit",
    "--",
  ])("keeps the author's wording in %s", (aliasName) => {
    expect(checkDisplayName({ aliasName, name: "OriginalCheck" })).toBe(
      aliasName,
    );
  });

  it("trims an alias", () => {
    expect(
      checkDisplayName({ aliasName: " Age 18-64 ", name: "OriginalCheck" }),
    ).toBe("Age 18-64");
  });

  it("falls back to the check's name unchanged", () => {
    expect(checkDisplayName({ name: "OriginalCheck" })).toBe("OriginalCheck");
  });

  it("ignores a blank alias", () => {
    expect(checkDisplayName({ aliasName: " ", name: "OriginalCheck" })).toBe(
      "OriginalCheck",
    );
  });
});
