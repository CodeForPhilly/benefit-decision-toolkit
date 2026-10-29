// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import PreviewResults from "@/components/screenerEditor/preview/Results";
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
        explanation: "You must be at least 65. <b>Plain text</b>",
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
        />
      ),
      container,
    );

    expect(container.textContent).toContain("Applicant Age Requirement");
  });

  it("displays aliases in published screener results", () => {
    const container = document.createElement("div");
    dispose = render(
      () => <EligibilityResults screenerResult={() => results} />,
      container,
    );

    expect(container.textContent).toContain("Applicant Age Requirement");
  });
  it.each(["published", "preview"])(
    "provides keyboard and screen-reader explanations in %s results",
    (mode) => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      dispose = render(
        () =>
          mode === "published" ? (
            <EligibilityResults screenerResult={() => results} />
          ) : (
            <PreviewResults
              inputData={() => ({})}
              results={() => results}
              resultsLoading={() => false}
            />
          ),
        container,
      );
      const trigger = container.querySelector<HTMLButtonElement>(
        'button[aria-label="About Applicant Age Requirement"]',
      )!;
      const tooltip = container.querySelector<HTMLElement>('[role="tooltip"]')!;
      expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
      expect(tooltip.hidden).toBe(true);
      trigger.focus();
      expect(tooltip.hidden).toBe(false);
      expect(tooltip.textContent).toBe(
        "You must be at least 65. <b>Plain text</b>",
      );
      expect(tooltip.querySelector("b")).toBeNull();
      trigger.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      expect(tooltip.hidden).toBe(true);
      expect(document.activeElement).toBe(trigger);
      trigger.blur();
      trigger.focus();
      expect(tooltip.hidden).toBe(false);
      container.remove();
    },
  );

  it("omits tooltip buttons for checks without explanations", () => {
    const container = document.createElement("div");
    const without = structuredClone(results);
    without.benefit.check_results.check.explanation = " ";
    dispose = render(
      () => <EligibilityResults screenerResult={() => without} />,
      container,
    );
    expect(container.querySelector("button")).toBeNull();
  });
});
