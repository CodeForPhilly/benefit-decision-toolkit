import { expect, it } from "vitest";
import { projectNextSteps } from "./nextSteps";
import type { ScreenerResult } from "@/types";

const results: ScreenerResult = {
  housing: { name: "Housing", result: "TRUE", check_results: {} },
  food: {
    name: "Food",
    result: "FALSE",
    check_results: {
      a: { result: "FALSE", name: "Income", aliasName: "Income limit" } as any,
      b: { result: "FALSE", name: "Residence", aliasName: " " } as any,
      c: { result: "TRUE", name: "Other requirement" } as any,
    },
  },
  utility: {
    name: "Utilities",
    result: "UNABLE_TO_DETERMINE",
    check_results: {},
  },
};
const field = {
  benefitContent: {
    housing: {
      eligible: {
        applyUrl: "https://example.org/apply",
        helpUrl: "https://example.org/help",
        helpPhone: " 215-555-0100 ",
        body: "Bring **ID**.",
      },
      ineligible: { note: "Not for eligible" },
    },
    food: {
      eligible: { applyUrl: "https://example.org/wrong" },
      ineligible: { note: "Ask about **other help**." },
    },
    removed: { eligible: { body: "Removed instructions" } },
  },
};

it("exports only decided benefits and the content matching each outcome", () => {
  const copy = structuredClone(field);
  expect(projectNextSteps(results, field)).toEqual({
    housing: {
      status: "eligible",
      applyUrl: "https://example.org/apply",
      help: { url: "https://example.org/help", phone: "215-555-0100" },
      body: { format: "markdown", text: "Bring **ID**." },
      unmetRequirements: [],
      note: null,
    },
    food: {
      status: "ineligible",
      applyUrl: null,
      help: { url: null, phone: null },
      body: null,
      unmetRequirements: ["Income limit", "Residence"],
      note: { format: "markdown", text: "Ask about **other help**." },
    },
  });
  expect(field).toEqual(copy);
});

it("omits the extension without a visible field and respects whenComplete", () => {
  expect(projectNextSteps(results)).toBeUndefined();
  expect(
    projectNextSteps(results, { ...field, showWhen: "whenComplete" }),
  ).toEqual({});
  expect(
    Object.keys(
      projectNextSteps(
        { housing: results.housing },
        { ...field, showWhen: "whenComplete" },
      )!,
    ),
  ).toEqual(["housing"]);
});

it("does not invent missing content or pass unsafe application links", () => {
  const exported = projectNextSteps(results, {
    benefitContent: {
      housing: {
        eligible: {
          applyUrl: "javascript:alert(1)",
          helpUrl: "https://user:secret@example.org/",
        },
      },
    },
  })!;
  expect(exported.housing).toEqual({
    status: "eligible",
    applyUrl: null,
    help: { url: null, phone: null },
    body: null,
    unmetRequirements: [],
    note: null,
  });
  expect(exported.food.note).toBeNull();
});
