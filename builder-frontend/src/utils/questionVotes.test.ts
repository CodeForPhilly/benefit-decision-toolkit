import { describe, expect, it } from "vitest";

import type { BenefitResult, OptionalBoolean, ScreenerResult } from "@/types";
import {
  getBenefitQuestionPaths,
  getUnneededQuestionPaths,
  haveSameQuestionPaths,
  hideQuestions,
} from "./questionVotes";

const results = (
  firstResult: OptionalBoolean,
  secondResult: OptionalBoolean,
): ScreenerResult => ({
  benefitA: {
    name: "Benefit A",
    result: firstResult,
    check_results: {
      checkA0: {
        name: "A",
        result: "TRUE",
        module: "",
        version: "",
        parameters: {},
        inputPaths: ["shared", "onlyA"],
      },
      checkA1: {
        name: "A again",
        result: "TRUE",
        module: "",
        version: "",
        parameters: {},
        inputPaths: ["onlyA"],
      },
    },
  },
  benefitB: {
    name: "Benefit B",
    result: secondResult,
    check_results: {
      checkB0: {
        name: "B",
        result: "TRUE",
        module: "",
        version: "",
        parameters: {},
        inputPaths: ["shared", "onlyB"],
      },
    },
  },
});

describe("question votes", () => {
  it("treats equivalent hidden-path results as unchanged", () => {
    expect(haveSameQuestionPaths(["a", "b"], ["a", "b"])).toBe(true);
    expect(haveSameQuestionPaths(["a", "b"], ["b", "a"])).toBe(true);
    expect(haveSameQuestionPaths(["a", "b"], ["a", "c"])).toBe(false);
  });

  it("combines and deduplicates all check paths for one benefit", () => {
    const benefit = results("FALSE", "TRUE").benefitA as BenefitResult;

    expect(getBenefitQuestionPaths(benefit)).toEqual(["shared", "onlyA"]);
  });

  it("drops a question only after every benefit voting for it is ineligible", () => {
    expect(
      getUnneededQuestionPaths(results("FALSE", "UNABLE_TO_DETERMINE")),
    ).toEqual(["onlyA"]);
    expect(getUnneededQuestionPaths(results("FALSE", "TRUE"))).toEqual([
      "onlyA",
    ]);
    expect(getUnneededQuestionPaths(results("FALSE", "FALSE"))).toEqual([
      "shared",
      "onlyA",
      "onlyB",
    ]);
  });

  it("keeps every question while no benefit is ineligible", () => {
    expect(getUnneededQuestionPaths(results("TRUE", "TRUE"))).toEqual([]);
    expect(getUnneededQuestionPaths(undefined)).toEqual([]);
  });

  it("removes matching nested form components without mutating the schema", () => {
    const schema = {
      id: "form",
      components: [
        { id: "name", key: "name", type: "textfield" },
        {
          id: "group",
          type: "group",
          components: [{ id: "age", key: "age", type: "number" }],
        },
      ],
    };

    const filtered = hideQuestions(schema, ["age"]);

    expect(filtered.components[1].components).toEqual([]);
    expect(schema.components[1].components).toHaveLength(1);
  });
});
