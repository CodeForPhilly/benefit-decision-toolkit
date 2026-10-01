// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EligibilityCheck } from "@/types";
import { RenameCheck } from "./RenameCheck";

describe("RenameCheck", () => {
  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function mount(onRename = vi.fn().mockResolvedValue(undefined)) {
    const container = document.body.appendChild(document.createElement("div"));
    const onClose = vi.fn();
    const onReviewPublish = vi.fn();
    dispose = render(
      () => (
        <RenameCheck
          check={{ id: "W-check", name: "Old name" } as EligibilityCheck}
          onRename={onRename}
          onClose={onClose}
          onReviewPublish={onReviewPublish}
        />
      ),
      container,
    );
    const input = container.querySelector("input")!;
    input.value = "  New name  ";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    const submit = () =>
      container
        .querySelector("form")!
        .dispatchEvent(
          new SubmitEvent("submit", { bubbles: true, cancelable: true }),
        );
    return { container, onClose, onReviewPublish, submit };
  }

  it("saves only the draft and offers a separate review step", async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    const { container, onClose, onReviewPublish, submit } = mount(onRename);
    submit();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Draft name saved"),
    );
    expect(onRename).toHaveBeenCalledWith("New name");
    expect(onClose).not.toHaveBeenCalled();
    expect(onReviewPublish).not.toHaveBeenCalled();
    expect(container.textContent).toContain(
      "Existing benefits keep their current check version and name",
    );
    const review = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Review & publish",
    )!;
    review.click();
    expect(onReviewPublish).toHaveBeenCalledOnce();
  });

  it("lets users finish without publishing", async () => {
    const { container, onClose, onReviewPublish, submit } = mount();
    submit();
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Draft name saved"),
    );
    [...container.querySelectorAll("button")]
      .find((button) => button.textContent === "Done")!
      .click();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onReviewPublish).not.toHaveBeenCalled();
  });

  it("keeps a rejected rename editable and hides the review action", async () => {
    const { container, onClose, submit } = mount(
      vi.fn().mockRejectedValue(new Error("Name already in use")),
    );
    submit();
    await vi.waitFor(() =>
      expect(container.querySelector('[role="alert"]')?.textContent).toBe(
        "Name already in use",
      ),
    );
    expect(container.querySelector("input")?.value).toBe("  New name  ");
    expect(container.textContent).not.toContain("Review & publish");
    expect(onClose).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });
});
