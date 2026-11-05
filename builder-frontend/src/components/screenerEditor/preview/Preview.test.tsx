// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";

import type { ScreenerResult } from "@/types";
import { input, settle, type, until } from "@/testing/formJs";

const previewResults = vi.hoisted(() => ({ props: undefined as any }));
vi.mock("@/api/screener", () => ({ evaluateScreener: vi.fn() }));
vi.mock("./Results", () => ({
  default: (props: any) => {
    previewResults.props = props;
    return <div />;
  },
}));
vi.mock("@/components/shared/Tooltip", () => ({ default: () => <div /> }));

import { evaluateScreener } from "@/api/screener";
import Preview from "./Preview";

const decided: ScreenerResult = {
  benefit: { name: "Benefit", result: "TRUE", check_results: {} },
};
const schema = {
  type: "default",
  id: "preview-test",
  schemaVersion: 18,
  components: [
    { id: "answer", type: "textfield", key: "answer", label: "Answer" },
  ],
};

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

it("evaluates the working screener on open and keeps the last results when an evaluation fails", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(evaluateScreener)
    .mockResolvedValueOnce(decided)
    .mockResolvedValueOnce(decided)
    .mockRejectedValueOnce(new Error("Unavailable"));
  const container = document.body.appendChild(document.createElement("div"));
  dispose = render(
    () => (
      <Preview screener={() => ({ id: "working" })} formSchema={() => schema} />
    ),
    container,
  );
  await until(() => expect(input("Answer")).toBeDefined());
  await until(() =>
    expect(evaluateScreener).toHaveBeenCalledExactlyOnceWith("working", {
      answer: "",
    }),
  );
  await settle();

  type("Answer", "first");
  await until(() => expect(evaluateScreener).toHaveBeenCalledTimes(2));
  await until(() =>
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "Screening complete",
    ),
  );
  expect(evaluateScreener).toHaveBeenLastCalledWith(
    "working",
    expect.objectContaining({ answer: "first" }),
  );
  expect(previewResults.props.results()).toEqual(decided);
  expect(previewResults.props.inputData()).toEqual(
    expect.objectContaining({ answer: "first" }),
  );

  type("Answer", "second");
  await until(() =>
    expect(container.querySelector('[role="alert"]')).not.toBeNull(),
  );
  expect(container.querySelector('[role="status"]')).toBeNull();
  expect(previewResults.props.results()).toEqual(decided);
});
