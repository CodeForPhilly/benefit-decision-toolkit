// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

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

  it("is placed against the viewport and follows its trigger while scrolling", () => {
    const { trigger, tooltip } = setup();
    let top = 100;
    trigger.parentElement!.getBoundingClientRect = () =>
      new DOMRect(300, top, 20, 20);
    trigger.focus();
    expect(tooltip.className).toContain("fixed");
    expect(tooltip.style.top).toBe("128px");
    expect(tooltip.style.left).toBe("182px");
    top = 60;
    // Scroll events don't bubble, so this reaches the window only while capturing.
    document.body.dispatchEvent(new Event("scroll"));
    expect(tooltip.style.top).toBe("88px");
  });

  function setupTall(triggerTop: number, contentHeight: number) {
    const elements = setup();
    elements.trigger.parentElement!.getBoundingClientRect = () =>
      new DOMRect(300, triggerTop, 20, 20);
    const content = elements.tooltip.firstElementChild as HTMLElement;
    Object.defineProperty(content, "scrollHeight", { value: contentHeight });
    return { ...elements, content };
  }

  it("opens upward when only the space above fits the content", () => {
    const { trigger, tooltip, content } = setupTall(700, 400);
    trigger.focus();
    expect(tooltip.style.bottom).toBe("76px");
    expect(tooltip.style.top).toBe("");
    expect(content.style.maxHeight).toBe("676px");
    expect(content.hasAttribute("tabindex")).toBe(false);
  });

  it("stays below when the content would fit better there", () => {
    const { trigger, tooltip } = setupTall(100, 900);
    trigger.focus();
    expect(tooltip.style.top).toBe("128px");
    expect(tooltip.style.bottom).toBe("");
  });

  it("lets keyboard users scroll content that overflows the viewport", () => {
    const { trigger, tooltip, content } = setupTall(100, 1100);
    trigger.focus();
    expect(content.style.maxHeight).toBe("624px");
    expect(content.tabIndex).toBe(0);
    content.focus();
    expect(tooltip.hidden).toBe(false);
    content.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(tooltip.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  const press = (target: EventTarget, pointerType: string) =>
    target.dispatchEvent(
      Object.assign(new Event("pointerdown", { bubbles: true }), {
        pointerType,
      }),
    );
  const hover = (trigger: HTMLElement) =>
    trigger.parentElement!.dispatchEvent(new MouseEvent("mouseenter"));
  const tap = (trigger: HTMLElement) => {
    press(trigger, "touch");
    hover(trigger);
    trigger.click();
  };

  it("dismisses a hovered tooltip with Escape without focusing it", () => {
    const { trigger, tooltip } = setup();
    const outerKeydown = vi.fn();
    document.body.addEventListener("keydown", outerKeydown);
    hover(trigger);
    expect(tooltip.hidden).toBe(false);
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(tooltip.hidden).toBe(true);
    expect(outerKeydown).not.toHaveBeenCalled();
    document.body.removeEventListener("keydown", outerKeydown);
  });

  it("toggles on repeated taps", () => {
    const { trigger, tooltip } = setup();
    tap(trigger);
    expect(tooltip.hidden).toBe(false);
    tap(trigger);
    expect(tooltip.hidden).toBe(true);
    tap(trigger);
    expect(tooltip.hidden).toBe(false);
  });

  it("closes when a press lands outside it, but not inside it", () => {
    const { trigger, tooltip, link } = setup();
    tap(trigger);
    press(link, "touch");
    expect(tooltip.hidden).toBe(false);
    press(document.body, "touch");
    expect(tooltip.hidden).toBe(true);
  });

  it("stays open when a mouse clicks a hovered trigger", () => {
    const { trigger, tooltip } = setup();
    hover(trigger);
    press(trigger, "mouse");
    trigger.click();
    expect(tooltip.hidden).toBe(false);
  });
});
