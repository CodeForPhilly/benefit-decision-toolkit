// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function setup(ariaLabel?: string) {
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <Tooltip ariaLabel={ariaLabel}>
          <a href="https://example.org">Learn more</a>
        </Tooltip>
      ),
      container,
    );
    return {
      trigger: container.querySelector("button")!,
      tooltip: container.querySelector<HTMLElement>('[role="tooltip"]')!,
      link: container.querySelector("a")!,
    };
  }

  it("describes a named trigger with the tooltip", () => {
    const { trigger, tooltip } = setup("About income");
    expect(trigger.getAttribute("aria-label")).toBe("About income");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
  });

  it("falls back to a general trigger name", () => {
    expect(setup().trigger.getAttribute("aria-label")).toBe("More information");
  });

  it("stays open while focus moves to a link inside it", () => {
    const { trigger, tooltip, link } = setup();
    trigger.focus();
    expect(tooltip.hidden).toBe(false);
    link.focus();
    expect(tooltip.hidden).toBe(false);
    link.blur();
    expect(tooltip.hidden).toBe(true);
  });
});
