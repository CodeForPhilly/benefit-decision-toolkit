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
) {
  const container = document.body.appendChild(document.createElement("div"));
  const [currentSchema, setSchema] = createSignal<any>(schema);
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
  await until(() => expect(input("Answer")).toBeDefined());
  await settle();
  return { session, container, dispose, setSchema };
}

const input = (label: string) =>
  Array.from(document.querySelectorAll("label")).find((element) =>
    element.textContent?.trim().startsWith(label),
  )?.control as HTMLInputElement | null | undefined;

// form-js renders once more just after an import, resetting what was typed before it.
const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

// The session waits for answers to stop changing.
const until = (assertion: () => void) =>
  vi.waitFor(assertion, { timeout: 3000 });

function type(label: string, value: string) {
  const field = input(label)!;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  // Leaving the field hands the answer to the form without form-js's typing delay.
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

describe("screening session", () => {
  it("evaluates the latest answers once they stop changing", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({ evaluate });
    expect(evaluate).not.toHaveBeenCalled();

    type("Answer", "fir");
    await until(() => expect(session.stale()).toBe(true));
    type("Answer", "first");
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

    type("Answer", "older");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    expect(session.loading()).toBe(true);
    type("Answer", "newer");
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

    type("Answer", "first");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    type("Answer", "second");
    inFlight.resolve(result("TRUE"));
    await inFlight.promise;

    expect(session.results()).toBeUndefined();
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

    type("Answer", "first");
    await until(() => expect(session.results()).toEqual(result("TRUE")));
    type("Answer", "second");
    await until(() => expect(session.failed()).toBe(true));
    expect(session.results()).toEqual(result("TRUE"));
    expect(session.stale()).toBe(true);
    expect(session.loading()).toBe(false);
    expect(onEvaluationFailed).toHaveBeenCalledOnce();

    type("Answer", "third");
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

    type("Answer", "older");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    type("Answer", "newer");
    older.reject(new Error("Unavailable"));
    await until(() => expect(session.results()).toEqual(result("TRUE")));

    expect(session.failed()).toBe(false);
    expect(onEvaluationFailed).not.toHaveBeenCalled();
  });

  it("hides questions no benefit needs, keeping typed answers, until asked to show them", async () => {
    const evaluate = vi.fn(async () => result("FALSE", ["income"]));
    const { session } = await start({ evaluate });

    type("Answer", "kept");
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

    type("Answer", "kept");
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
    });

    await until(() => expect(onResults).toHaveBeenCalledOnce());
    expect(evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: "From the host", married: null }),
    );
    expect(session.answersSent()).toEqual(
      expect.objectContaining({ married: null }),
    );

    type("Answer", "Edited");
    await until(() => expect(evaluate).toHaveBeenCalledTimes(2));
    expect(evaluate).toHaveBeenLastCalledWith(
      expect.objectContaining({ answer: "Edited", married: null }),
    );
  });

  it("evaluates empty provided answers on load", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({ evaluate, initialAnswers: {} });

    await until(() => expect(session.results()).toEqual(result("TRUE")));
    expect(evaluate).toHaveBeenCalledOnce();
  });

  it("waits for an edit when no answers were provided", async () => {
    const evaluate = vi.fn(async () => result("TRUE"));
    const { session } = await start({ evaluate });

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(evaluate).not.toHaveBeenCalled();
    expect(session.stale()).toBe(false);
  });

  it("drops a pending edit and an evaluation in flight when disposed", async () => {
    const inFlight = deferred();
    const onResults = vi.fn();
    const evaluate = vi.fn(() => inFlight.promise);
    const first = await start({ evaluate, onResults });

    type("Answer", "sent");
    await until(() => expect(evaluate).toHaveBeenCalledOnce());
    first.dispose();
    inFlight.resolve(result("TRUE"));
    await inFlight.promise;
    expect(onResults).not.toHaveBeenCalled();
    expect(first.session.results()).toBeUndefined();

    const second = await start({ evaluate });
    type("Answer", "never sent");
    second.dispose();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(evaluate).toHaveBeenCalledOnce();
  });
});
