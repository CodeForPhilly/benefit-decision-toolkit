// @vitest-environment jsdom

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import HiddenQuestionsNotice from "./HiddenQuestionsNotice";

describe("hidden questions notice", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  const renderNotice = (count: number) => {
    // Solid delegates click events at the document, so the container has to be
    // attached for the toggle to fire.
    const container = document.body.appendChild(document.createElement("div"));
    const [showAllQuestions, setShowAllQuestions] = createSignal(false);

    dispose = render(
      () => (
        <HiddenQuestionsNotice
          unneededQuestionCount={() => count}
          showAllQuestions={showAllQuestions}
          onToggleShowAllQuestions={() =>
            setShowAllQuestions((current) => !current)
          }
        />
      ),
      container,
    );

    return container;
  };

  it("renders nothing while every question is still needed", () => {
    expect(renderNotice(0).textContent).toBe("");
  });

  it("counts the hidden questions in singular and plural", () => {
    expect(renderNotice(1).textContent).toContain("1 question is hidden");
    dispose?.();
    expect(renderNotice(4).textContent).toContain("4 questions are hidden");
  });

  it("swaps to the hide action once the questions are shown", () => {
    const container = renderNotice(2);
    const button = container.querySelector("button")!;

    expect(button.textContent).toBe("Show all questions");

    button.click();

    expect(container.querySelector("button")!.textContent).toBe(
      "Hide questions that aren't needed",
    );
    expect(container.textContent).not.toContain("hidden");
  });
});
