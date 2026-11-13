// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, expect, it } from "vitest";
import LibraryReference from "./LibraryReference";
import type { LibraryReference as Reference } from "@/types";

let dispose: () => void;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});

const benefitReference: Reference = {
  summary: "Helps Pennsylvania households pay for home heating.",
  explanation: "LIHEAP Cash is a grant that helps households pay for heating.",
  administeredBy: {
    name: "Pennsylvania Department of Human Services",
    url: "https://www.pa.gov/agencies/dhs/resources/liheap",
  },
  programYear: {
    label: "2026-27 season",
    startDate: "2026-11-02",
    endDate: "2027-04-23",
  },
  checks: [
    {
      alias: "NotAlreadyEnrolled",
      operationId: "PersonNotEnrolledInBenefitService",
      rationale: "A household can receive one Cash grant per season.",
    },
  ],
  sources: [
    {
      title: "FFY 2027 Final State Plan",
      url: "https://example.gov/plan.pdf",
      citation: "601.31(2)",
      checkedOn: "2026-11-12",
    },
    {
      title: "HSEA 1 application",
      url: null,
      citation: null,
      checkedOn: "2026-11-12",
    },
  ],
  limitations: ["Household size is taken as given."],
  lastReviewed: "2026-11-12",
  docsPath: "library/benefits/pa/liheap-cash/",
};

const text = () => document.body.textContent ?? "";

it("shows the summary, and every reference field in a collapsed panel", () => {
  dispose = render(
    () => <LibraryReference reference={benefitReference} />,
    document.body,
  );

  expect(text()).toContain(
    "Helps Pennsylvania households pay for home heating.",
  );
  const panel = document.querySelector("details")!;
  expect(panel.open).toBe(false);
  expect(panel.querySelector("summary")!.textContent).toBe("Reference");

  for (const expected of [
    "LIHEAP Cash is a grant that helps households pay for heating.",
    "Pennsylvania Department of Human Services",
    "2026-27 season: Nov 2, 2026 to Apr 23, 2027",
    "Not already enrolled",
    "A household can receive one Cash grant per season.",
    "Household size is taken as given.",
    "FFY 2027 Final State Plan",
    "601.31(2)",
    "HSEA 1 application",
    "Last reviewed Nov 12, 2026",
  ]) {
    expect(panel.textContent).toContain(expected);
  }
  const docsLink = Array.from(panel.querySelectorAll("a")).find(
    (link) =>
      link.href === "https://bdt-docs.web.app/library/benefits/pa/liheap-cash/",
  );
  expect(docsLink?.target).toBe("_blank");
});

it("lists a check's parameters", () => {
  dispose = render(
    () => (
      <LibraryReference
        reference={{
          ...benefitReference,
          administeredBy: undefined,
          programYear: undefined,
          checks: undefined,
          parameters: [
            {
              name: "percent",
              type: "number",
              description: "Percentage of the poverty guideline.",
            },
          ],
        }}
      />
    ),
    document.body,
  );

  expect(text()).toContain("percent");
  expect(text()).toContain("Percentage of the poverty guideline.");
  expect(text()).not.toContain("Administered by");
});

it("never shows contributor implementation notes", () => {
  dispose = render(
    () => (
      <LibraryReference
        reference={
          {
            ...benefitReference,
            implementationNotes: [
              { decision: "checks", text: "Internal note" },
            ],
          } as Reference
        }
      />
    ),
    document.body,
  );

  expect(text()).not.toContain("Internal note");
});

it("renders nothing for items without a reference", () => {
  dispose = render(
    () => <LibraryReference reference={undefined} />,
    document.body,
  );

  expect(document.body.innerHTML).toBe("");
});
