// @vitest-environment jsdom

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";
import type { OptionalBoolean, ScreenerResult } from "@/types";
import ScreeningComplete from "./ScreeningComplete";

describe("screening completion", () => {
  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function mount(verdicts: OptionalBoolean[]) {
    const [results, setResults] = createSignal<ScreenerResult>();
    const [pending, setPending] = createSignal(false);
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => <ScreeningComplete results={results} pending={pending} />,
      container,
    );
    setResults(
      Object.fromEntries(
        verdicts.map((result, index) => [
          index,
          { name: "Benefit", result, check_results: {} },
        ]),
      ),
    );
    return { container, setPending, setResults };
  }

  it.each(
    (
      [
        [],
        ["TRUE", "UNABLE_TO_DETERMINE"],
        ["FALSE", "UNABLE_TO_DETERMINE"],
      ] as OptionalBoolean[][]
    ).map((verdicts) => ({ verdicts })),
  )(
    "does not announce completion with undecided or absent benefits: %j",
    ({ verdicts }) => expect(mount(verdicts).container.textContent).toBe(""),
  );

  it.each(
    (
      [
        ["TRUE", "FALSE"],
        ["FALSE", "FALSE"],
        ["TRUE", "TRUE"],
      ] as OptionalBoolean[][]
    ).map((verdicts) => ({ verdicts })),
  )("announces completion after all benefits are decided: %j", ({ verdicts }) =>
    expect(
      mount(verdicts).container.querySelector('[role="status"]')?.textContent,
    ).toContain("Screening complete"),
  );

  it("removes a stale completion message as soon as answers change", () => {
    const { container, setPending, setResults } = mount(["TRUE"]);
    setPending(true);
    expect(container.textContent).toBe("");
    setResults(undefined);
    setPending(false);
    expect(container.textContent).toBe("");
  });
});
