import { expect, it } from "vitest";
import {
  indexQuestions,
  unansweredQuestions as fromIndex,
} from "./unansweredQuestions";
import { normalizeArrayFieldData } from "./arrayFieldData";
import {
  findFilledUnknownPaths,
  restoreUnknownAnswers,
} from "./unknownAnswers";
import type { ScreenerResult } from "@/types";

const unansweredQuestions = (
  schema: Parameters<typeof indexQuestions>[0],
  ...rest: [unknown, ScreenerResult | undefined]
) => fromIndex(indexQuestions(schema), ...rest);

const schema = {
  components: [
    { key: "custom.income", label: "Annual household income" },
    { key: "custom.resident", label: "Do you live here?" },
    {
      key: "custom.programs",
      type: "checklist_none",
      label: "Current benefit programs",
    },
    {
      path: "client",
      components: [
        { key: "birthdate", subtype: "date", dateLabel: "Your date of birth" },
      ],
    },
  ],
};
const check = (inputPaths: string[], result = "UNABLE_TO_DETERMINE") =>
  ({ inputPaths, result }) as any;
const results: ScreenerResult = {
  housing: {
    name: "Housing",
    result: "UNABLE_TO_DETERMINE",
    check_results: {
      a: check([
        "custom.income",
        "custom.resident",
        "custom.programs",
        "client.birthdate",
      ]),
      b: check(["custom.income"]),
      decided: check(["not-needed"], "TRUE"),
    },
  },
  decided: {
    name: "Decided",
    result: "FALSE",
    check_results: { a: check(["custom.income"]) },
  },
};

it("lists mapped unanswered questions only for unknown checks of undecided benefits", () => {
  expect(
    unansweredQuestions(
      schema,
      {
        custom: { income: null, resident: false, programs: [] },
        client: { birthdate: "" },
      },
      results,
    ),
  ).toEqual({
    housing: ["Annual household income", "Your date of birth"],
  });
  expect(
    unansweredQuestions(
      schema,
      {
        custom: { income: 0, resident: false, programs: [] },
        client: { birthdate: "1950-01-01" },
      },
      results,
    ),
  ).toEqual({});
});

it("distinguishes unknown CRM prefill and untouched lists from explicit No and None", () => {
  const prefill = { custom: { resident: null } };
  const initialized = { custom: { resident: false, programs: [] } };
  const normalized = normalizeArrayFieldData(
    schema,
    restoreUnknownAnswers(
      initialized,
      findFilledUnknownPaths(prefill, initialized),
    ),
  );
  expect(unansweredQuestions(schema, normalized, results).housing).toContain(
    "Do you live here?",
  );
  expect(unansweredQuestions(schema, normalized, results).housing).toContain(
    "Current benefit programs",
  );
  const explicit = normalizeArrayFieldData(schema, {
    custom: { resident: false, programs: ["__bdt_none_of_these__"] },
  });
  expect(unansweredQuestions(schema, explicit, results).housing).not.toContain(
    "Do you live here?",
  );
  expect(unansweredQuestions(schema, explicit, results).housing).not.toContain(
    "Current benefit programs",
  );
});

it("handles repeated sections and shared votes without exposing paths or values", () => {
  const form = {
    components: [
      { path: "people", components: [{ key: "age", label: "Age" }] },
      { key: "secret", label: "=secret" },
      { key: "templated", label: "Age of {{ client.name }}" },
    ],
  };
  const result: ScreenerResult = {
    benefit: {
      name: "Benefit",
      result: "UNABLE_TO_DETERMINE",
      check_results: {
        a: check(["people.age", "secret", "templated", "unbound.path"]),
        b: check(["people.age"]),
      },
    },
  };
  expect(
    unansweredQuestions(
      form,
      { people: [{ age: 42 }, { age: null }], secret: null },
      result,
    ),
  ).toEqual({ benefit: ["Age"] });
  expect(
    unansweredQuestions(form, { people: [{ age: 42 }], secret: null }, result),
  ).toEqual({});
  expect(unansweredQuestions(form, { people: [] }, result)).toEqual({
    benefit: ["Age"],
  });
});

it("tells apart fields sharing a label and items of a repeated section", () => {
  const form = {
    components: [
      {
        path: "client",
        label: "You",
        components: [{ key: "birthdate", label: "Date of birth" }],
      },
      {
        path: "spouse",
        label: "Your spouse",
        components: [{ key: "birthdate", label: "Date of birth" }],
      },
      {
        path: "people",
        label: "Household member",
        isRepeating: true,
        components: [{ key: "age", label: "Age" }],
      },
    ],
  };
  const result: ScreenerResult = {
    benefit: {
      name: "Benefit",
      result: "UNABLE_TO_DETERMINE",
      check_results: {
        a: check(["client.birthdate", "spouse.birthdate", "people.age"]),
      },
    },
  };
  expect(
    unansweredQuestions(
      form,
      { client: {}, spouse: {}, people: [{ age: 4 }, { age: null }, {}] },
      result,
    ),
  ).toEqual({
    benefit: [
      "Date of birth (You)",
      "Date of birth (Your spouse)",
      "Age (Household member #2)",
      "Age (Household member #3)",
    ],
  });
  expect(
    unansweredQuestions(
      form,
      { client: { birthdate: "1950-01-01" }, people: [{ age: null }] },
      result,
    ),
  ).toEqual({ benefit: ["Date of birth (Your spouse)", "Age"] });
});

it("skips fields and repeated sections hidden by a condition", () => {
  const form = {
    components: [
      {
        path: "spouse",
        components: [{ key: "income", label: "Spouse income" }],
      },
      {
        path: "people",
        label: "Household member",
        isRepeating: true,
        components: [{ key: "age", label: "Age" }],
      },
    ],
  };
  const result: ScreenerResult = {
    benefit: {
      name: "Benefit",
      result: "UNABLE_TO_DETERMINE",
      check_results: { a: check(["spouse.income", "people.age"]) },
    },
  };
  const answers = { people: [{ age: null }, { age: null }] };
  const ask = (hidden: string[]) =>
    fromIndex(indexQuestions(form), answers, result, new Set(hidden)).benefit;
  expect(ask(["spouse.income", "people.0.age"])).toEqual([
    "Age (Household member #2)",
  ]);
  expect(ask(["spouse.income", "people"])).toBeUndefined();
});

it("treats whitespace as answered, as the eligibility service receives it", () => {
  expect(
    unansweredQuestions(
      schema,
      {
        custom: { income: "  ", resident: false, programs: ["x"] },
        client: { birthdate: "1950-01-01" },
      },
      results,
    ),
  ).toEqual({});
});

it("does not prompt for missing inputs in already decided checks", () => {
  expect(
    unansweredQuestions(
      { components: [{ key: "not-needed", label: "Already decided" }] },
      {},
      results,
    ),
  ).toEqual({});
  expect(unansweredQuestions(schema, {}, undefined)).toEqual({});
});
