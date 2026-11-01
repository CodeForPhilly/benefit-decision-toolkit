import { describe, expect, it } from "vitest";

import { checkDisplayName } from "./checkDisplayName";

describe("checkDisplayName", () => {
  it("title-cases an alias", () => {
    expect(
      checkDisplayName({ aliasName: "incomeLimit", name: "OriginalCheck" }),
    ).toBe("Income Limit");
  });

  it("falls back to the check's name unchanged", () => {
    expect(checkDisplayName({ name: "OriginalCheck" })).toBe("OriginalCheck");
  });
});
