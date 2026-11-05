// @vitest-environment jsdom
import { createRoot, createSignal } from "solid-js";
import { insert } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ScreenerResult } from "@/types";
import {
  createScreeningSession,
  type ScreeningAnswers,
  type ScreeningSessionOptions,
} from "./screeningSession";
import { answer, input, until } from "@/testing/formJs";

const schema = {
  type: "default",
  id: "session-test",
  schemaVersion: 18,
  components: [
    { id: "answer", type: "textfield", key: "answer", label: "Answer" },
    { id: "income", type: "number", key: "income", label: "Income" },
    { id: "married", type: "checkbox", key: "married", label: "Married" },
  ],
};

const result = (
  value: "TRUE" | "FALSE" | "UNABLE_TO_DETERMINE",
  inputPaths: string[] = [],
): ScreenerResult => ({
  benefit: {
    name: "Benefit",
    result: value,
    check_results: {
      check: { name: "Check", result: value, inputPaths } as any,
    },
  },
});

function deferred() {
  let resolve!: (value: ScreenerResult) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<ScreenerResult>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const disposers: (() => void)[] = [];
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

async function start(
  options: Partial<ScreeningSessionOptions> & {
    evaluate: ScreeningSessionOptions["evaluate"];
  },
  formSchema: object = schema,
) {
  const container = document.body.appendChild(document.createElement("div"));
  const [currentSchema, setSchema] = createSignal<any>(formSchema);
  let dispose!: () => void;
  const session = createRoot((disposeRoot) => {
    dispose = disposeRoot;
    const created = createScreeningSession({
      schema: currentSchema,
      ...options,
    });
    insert(container, () => <created.Form />);
    return created;
  });
  disposers.push(dispose);
  await until(() =>
    expect(container.querySelector(".fjs-form")).not.toBeNull(),
  );
  return { session, container, dispose, setSchema };
}

describe("screening session", () => {
  it("evaluates the latest answers once they stop changing", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({ evaluate });
    expect(evaluate).not.toHaveBeenCalled();

    answer("Answer", "fir");
    await until(() => expect(session.stale()).toBe(true));
    answer("Answer", "first");
    expect(session.loading()).toBe(false);

    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    expect(evaluate).toHaveBeenCalledWith(
      expect.objectContaining({ answer: "first" }),
    );
    await until(() => expect(session.results()).toEqual(result("TRUE")));
    expect(session.stale()).toBe(false);
    expect(session.loading()).toBe(false);
    expect(session.answersSent()).toEqual(
      expect.objectContaining({ answer: "first" }),
    );
  });

  it("ignores an older evaluation that finishes after a newer one", async () => {
    const older = deferred();
    const onResults = vi.fn();
    const evaluate = vi
      .fn<(answers: ScreeningAnswers) => Promise<ScreenerResult>>()
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(result("FALSE"));
    const { session } = await start({ evaluate, onResults });

    answer("Answer", "older");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    expect(session.loading()).toBe(true);
    answer("Answer", "newer");
    await until(() => expect(session.results()).toEqual(result("FALSE")));
    older.resolve(result("TRUE"));
    await older.promise;

    expect(session.results()).toEqual(result("FALSE"));
    expect(onResults).toHaveBeenCalledOnce();
    expect(onResults).toHaveBeenCalledWith(
      expect.objectContaining({ answer: "newer" }),
      result("FALSE"),
    );
  });

  it("outdates an evaluation in flight as soon as an answer changes", async () => {
    const inFlight = deferred();
    const onResults = vi.fn();
    const evaluate = vi.fn(() => inFlight.promise);
    const { session } = await start({ evaluate, onResults });

    answer("Answer", "first");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    expect(session.loading()).toBe(true);
    answer("Answer", "second");
    expect(session.loading()).toBe(false);
    inFlight.resolve(result("TRUE"));
    await inFlight.promise;

    expect(session.results()).toBeUndefined();
    expect(session.loading()).toBe(false);
    expect(session.stale()).toBe(true);
    expect(onResults).not.toHaveBeenCalled();
  });

  it("keeps the last results when an evaluation fails, until one succeeds", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onEvaluationFailed = vi.fn();
    const evaluate = vi
      .fn<(answers: ScreeningAnswers) => Promise<ScreenerResult>>()
      .mockResolvedValueOnce(result("TRUE"))
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce(result("FALSE"));
    const { session } = await start({ evaluate, onEvaluationFailed });

    answer("Answer", "first");
    await until(() => expect(session.results()).toEqual(result("TRUE")));
    answer("Answer", "second");
    await until(() => expect(session.failed()).toBe(true));
    expect(session.results()).toEqual(result("TRUE"));
    expect(session.stale()).toBe(true);
    expect(session.loading()).toBe(false);
    expect(onEvaluationFailed).toHaveBeenCalledOnce();

    answer("Answer", "third");
    await until(() => expect(session.results()).toEqual(result("FALSE")));
    expect(session.failed()).toBe(false);
  });

  it("ignores a failure of an outdated evaluation", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const older = deferred();
    const onEvaluationFailed = vi.fn();
    const evaluate = vi
      .fn<(answers: ScreeningAnswers) => Promise<ScreenerResult>>()
      .mockReturnValueOnce(older.promise)
      .mockResolvedValueOnce(result("TRUE"));
    const { session } = await start({ evaluate, onEvaluationFailed });

    answer("Answer", "older");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    answer("Answer", "newer");
    older.reject(new Error("Unavailable"));
    await until(() => expect(session.results()).toEqual(result("TRUE")));

    expect(session.failed()).toBe(false);
    expect(onEvaluationFailed).not.toHaveBeenCalled();
  });

  it("hides questions no benefit needs, keeping typed answers, until asked to show them", async () => {
    const evaluate = vi.fn(async () => result("FALSE", ["income"]));
    const { session } = await start({ evaluate });

    answer("Answer", "kept");
    await until(() => expect(input("Income")).toBeUndefined());
    expect(session.unneededQuestionCount()).toBe(1);
    expect(input("Answer")!.value).toBe("kept");

    session.toggleShowAllQuestions();
    await until(() => expect(input("Income")).toBeDefined());
    expect(session.showAllQuestions()).toBe(true);
    expect(input("Answer")!.value).toBe("kept");
    expect(evaluate).toHaveBeenCalledOnce();
  });

  it("shows a changed schema without losing answers", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { setSchema } = await start({ evaluate });

    answer("Answer", "kept");
    setSchema({
      ...schema,
      components: [
        ...schema.components,
        { id: "age", type: "number", key: "age", label: "Age" },
      ],
    });
    await until(() => expect(input("Age")).toBeDefined());
    expect(input("Answer")!.value).toBe("kept");
  });

  it("evaluates provided answers on load, sending unknown ones as null until answered", async () => {
    const onResults = vi.fn();
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({
      evaluate,
      onResults,
      initialAnswers: { answer: "From the host", married: null },
      evaluateOnLoad: true,
    });

    await until(() => expect(onResults).toHaveBeenCalledOnce());
    expect(evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: "From the host", married: null }),
    );
    expect(session.answersSent()).toEqual(
      expect.objectContaining({ married: null }),
    );

    answer("Answer", "Edited");
    await until(() => expect(evaluate).toHaveBeenCalledTimes(2));
    expect(evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: "Edited", married: null }),
    );

    // Answering "No" is still an answer, even though it looks unanswered.
    input("Married")!.click();
    input("Married")!.click();
    await until(() => expect(evaluate).toHaveBeenCalledTimes(3));
    expect(evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: "Edited", married: false }),
    );
  });

  it("treats every missing provided answer as unknown", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({
      evaluate,
      initialAnswers: {},
      evaluateOnLoad: true,
    });

    await until(() => expect(session.results()).toEqual(result("TRUE")));
    expect(evaluate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ answer: null, married: null }),
    );
  });

  it("evaluates form-js's empty values on load when no answers were provided", async () => {
    const evaluate = vi.fn(async () => result("FALSE"));
    const { session } = await start({ evaluate, evaluateOnLoad: true });

    await until(() => expect(session.results()).toEqual(result("FALSE")));
    expect(evaluate).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ answer: "", married: false }),
    );
  });

  it("waits for an edit unless asked to evaluate on load", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({
      evaluate,
      initialAnswers: { answer: "From the host" },
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(evaluate).not.toHaveBeenCalled();
    expect(session.stale()).toBe(false);
  });

  it("drops a pending edit and an evaluation in flight when disposed", async () => {
    const inFlight = deferred();
    const onResults = vi.fn();
    const evaluate = vi.fn(() => inFlight.promise);
    const first = await start({ evaluate, onResults });

    answer("Answer", "sent");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    first.dispose();
    inFlight.resolve(result("TRUE"));
    await inFlight.promise;
    expect(onResults).not.toHaveBeenCalled();
    expect(first.session.results()).toBeUndefined();

    const second = await start({ evaluate });
    answer("Answer", "never sent");
    second.dispose();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(evaluate).toHaveBeenCalledOnce();
  });
});

describe("next steps for CRM hosts", () => {
  const decided = result("TRUE");
  const evaluate = async () => decided;
  const nextSteps = (id: string, body: string, field: object = {}) => ({
    id,
    type: "next_steps",
    benefitContent: { benefit: { eligible: { body } } },
    ...field,
  });
  const form = (components: object[]) => ({
    type: "default",
    id: "next-steps-form",
    schemaVersion: 18,
    components,
  });

  it("follows what the form shows, and projects nothing once disposed", async () => {
    const { session, dispose } = await start(
      { evaluate, initialAnswers: { show: true } },
      form([
        { id: "show", type: "checkbox", key: "show", label: "Show" },
        nextSteps("next", "Saved instructions", {
          conditional: { hide: "=not(show)" },
        }),
      ]),
    );
    expect(session.projectNextSteps(decided)?.benefit.body?.text).toBe(
      "Saved instructions",
    );
    input("Show")!.click();
    // Follows the answers at once, without waiting for form-js to repaint.
    expect(session.projectNextSteps(decided)).toBeUndefined();
    input("Show")!.click();
    expect(session.projectNextSteps(decided)).toBeDefined();
    dispose();
    expect(session.projectNextSteps(decided)).toBeUndefined();
  });

  it("reads visibility from conditions, including groups, while hidden questions re-import the form", async () => {
    const projected: unknown[] = [];
    const { session } = await start(
      {
        evaluate: async () => result("FALSE", ["city"]),
        onResults: () => projected.push(session.projectNextSteps(decided)),
      },
      form([
        { id: "city", type: "textfield", key: "city", label: "City" },
        {
          id: "hiddenGroup",
          type: "group",
          conditional: { hide: "=true" },
          components: [nextSteps("inHidden", "Hidden group")],
        },
        {
          id: "shownGroup",
          type: "group",
          components: [nextSteps("inShown", "Shown group")],
        },
      ]),
    );
    expect(session.projectNextSteps(decided)?.benefit.body?.text).toBe(
      "Shown group",
    );

    answer("City", "Philadelphia");
    await until(() => expect(projected).toHaveLength(1));
    expect(input("City")).toBeUndefined();
    expect(projected[0]).toEqual(session.projectNextSteps(decided));
    expect(session.projectNextSteps(decided)?.benefit.body?.text).toBe(
      "Shown group",
    );
  });

  it("reports whether a Next steps field is showing, so the page can skip its own completion message", async () => {
    const { session } = await start(
      { evaluate },
      form([
        { id: "show", type: "checkbox", key: "show", label: "Show" },
        nextSteps("next", "Saved instructions", {
          conditional: { hide: "=not(show)" },
        }),
      ]),
    );
    expect(session.nextStepsShown()).toBe(false);
    input("Show")!.click();
    await until(() => expect(session.nextStepsShown()).toBe(true));
    input("Show")!.click();
    await until(() => expect(session.nextStepsShown()).toBe(false));
  });

  it("projects visible instructions from a dynamic list with repetition disabled", async () => {
    const { session } = await start(
      { evaluate, initialAnswers: { person: { show: true } } },
      form([
        {
          id: "person",
          type: "dynamiclist",
          path: "person",
          isRepeating: false,
          components: [
            { id: "show", type: "checkbox", key: "show", label: "Show" },
            nextSteps("next", "Single-person instructions", {
              conditional: { hide: "=not(person.show)" },
            }),
          ],
        },
      ]),
    );
    expect(session.projectNextSteps(decided)?.benefit.body?.text).toBe(
      "Single-person instructions",
    );
  });

  it.each([
    [[{ show: false }, { show: true }], "Per item"],
    [[{ show: false }], undefined],
  ])(
    "checks Next steps in a repeated group against each item (%j)",
    async (people, body) => {
      const { session } = await start(
        { evaluate, initialAnswers: { people } },
        form([
          {
            id: "people",
            type: "dynamiclist",
            path: "people",
            components: [
              { id: "show", type: "checkbox", key: "show", label: "Show" },
              nextSteps("next", "Per item", {
                conditional: { hide: "=not(this.show)" },
              }),
            ],
          },
        ]),
      );
      expect(session.projectNextSteps(decided)?.benefit?.body?.text).toBe(body);
    },
  );
});
