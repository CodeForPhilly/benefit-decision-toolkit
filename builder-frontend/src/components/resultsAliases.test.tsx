// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import PreviewResults from "@/components/project/preview/Results";
import EligibilityResults from "@/components/screener/EligibilityResults";
import type { ScreenerResult } from "@/types";

const results: ScreenerResult = {
  benefit: {
    name: "Test benefit",
    result: "TRUE",
    check_results: {
      check: {
        name: "OriginalCheckName",
        aliasName: "ApplicantAgeRequirement",
        result: "TRUE",
        module: "age",
        version: "1.0.0",
        parameters: {},
        inputPaths: [],
      },
    },
  },
};

describe("eligibility result aliases", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => dispose?.());

  it("displays aliases in builder preview results", () => {
    const container = document.createElement("div");
    dispose = render(
      () => (
        <PreviewResults
          inputData={() => ({})}
          results={() => results}
          resultsLoading={() => false}
          reviewedBenefits={() => []}
          onReviewBenefit={() => undefined}
        />
      ),
      container,
    );

    expect(container.textContent).toContain("Applicant Age Requirement");
  });

  it("displays aliases in published screener results", () => {
    const container = document.createElement("div");
    dispose = render(
      () => (
        <EligibilityResults
          screenerResult={() => results}
          reviewedBenefits={() => []}
          onReviewBenefit={() => undefined}
        />
      ),
      container,
    );

    expect(container.textContent).toContain("Applicant Age Requirement");
  });
});
