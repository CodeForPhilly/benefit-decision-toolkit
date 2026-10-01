import { describe, expect, it } from "vitest";
import type { CustomCheckWithDmn } from "@/types";
import { matchesPublishedCheck, sortPublishedChecks } from "./checkPublication";

const check: CustomCheckWithDmn = {
  id: "W-check",
  name: "Income",
  module: "income",
  description: "Income limit",
  version: "1.0.0",
  dmnModel: "<definitions />",
  inputDefinition: {},
  parameterDefinitions: [
    { key: "limit", label: "Limit", type: "number", required: true },
  ],
};

describe("check publication comparison", () => {
  it("sorts versions numerically without mutating the response", () => {
    const versions = ["2.0.0", "10.0.0", "2.1.0", "2.0.1"];
    const checks = versions.map((version) => ({ ...check, version }));
    expect(sortPublishedChecks(checks).map((check) => check.version)).toEqual([
      "10.0.0",
      "2.1.0",
      "2.0.1",
      "2.0.0",
    ]);
    expect(checks.map((check) => check.version)).toEqual(versions);
  });

  it("ignores snapshot identifiers and derived schema and normalizes legacy XML", () => {
    expect(
      matchesPublishedCheck(check, {
        ...check,
        id: "P-check-2.0.0",
        version: "2.0.0",
        inputDefinition: { type: "object" },
        dmnModel: JSON.stringify(check.dmnModel),
        parameterDefinitions: [
          { required: true, type: "number", label: "Limit", key: "limit" },
        ],
      }),
    ).toBe(true);
  });

  it.each([
    { name: "Renamed" },
    { description: "New description" },
    { module: "other" },
    { dmnModel: "<definitions>updated</definitions>" },
    { parameterDefinitions: [] },
  ])("detects saved changes: %j", (changes) => {
    expect(matchesPublishedCheck({ ...check, ...changes }, check)).toBe(false);
  });

  it("does not claim a missing model is published", () => {
    expect(
      matchesPublishedCheck(
        { ...check, dmnModel: "" },
        { ...check, dmnModel: "" },
      ),
    ).toBe(false);
  });
});
