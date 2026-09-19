import { describe, expect, it, vi } from "vitest";
import PathOptionsService, { isTypeCompatible } from "./pathOptionsService";

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

describe("PathOptionsService", () => {
  it("omits keys used by other fields while keeping the current field's key", () => {
    const service = new PathOptionsService(
      { fire: vi.fn() },
      {
        getAll: () => [
          { key: "simpleChecks.livesInPhiladelphiaPa" },
          { key: "simpleChecks.ownerOccupant" },
        ],
      },
    );

    service.setOptions([
      {
        value: "simpleChecks.livesInPhiladelphiaPa",
        label: "Lives in Philadelphia",
        type: "boolean",
      },
      {
        value: "simpleChecks.ownerOccupant",
        label: "Owner occupant",
        type: "boolean",
      },
      {
        value: "simpleChecks.tenYearTaxAbatement",
        label: "Ten-year tax abatement",
        type: "boolean",
      },
    ]);

    expect(
      service.getOptions("simpleChecks.livesInPhiladelphiaPa", "yes_no"),
    ).toEqual([
      {
        value: "simpleChecks.livesInPhiladelphiaPa",
        label: "Lives in Philadelphia",
        type: "boolean",
      },
      {
        value: "simpleChecks.tenYearTaxAbatement",
        label: "Ten-year tax abatement",
        type: "boolean",
      },
    ]);
  });
});
