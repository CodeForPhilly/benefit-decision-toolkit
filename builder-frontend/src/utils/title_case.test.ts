import { describe, expect, it } from "vitest";
import { sentenceCase, titleCase } from "./title_case";

describe("titleCase", () => {
  it("formats endpoint slugs", () => {
    expect(titleCase("phl-senior-citizen-tax-freeze")).toBe(
      "Phl senior citizen tax freeze",
    );
  });

  it("formats DMN context aliases", () => {
    expect(titleCase("NotAlreadyOnHomestead")).toBe("Not Already On Homestead");
  });
});

describe("sentenceCase", () => {
  it("lowercases every word after the first", () => {
    expect(sentenceCase("NotAlreadyEnrolled")).toBe("Not already enrolled");
  });

  it("splits numbers from the words around them", () => {
    expect(sentenceCase("IncomeAtOrBelow150PercentFpl")).toBe(
      "Income at or below 150 percent fpl",
    );
  });
});
