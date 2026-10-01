// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  function mount(dismissible?: boolean) {
    const onClose = vi.fn();
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <Modal show onClose={onClose} dismissible={dismissible}>
          Content
        </Modal>
      ),
      container,
    );
    const backdrop = document.querySelector<HTMLElement>("[data-modal-root]")!;
    const closeButton = backdrop.querySelector("button")!;
    return { onClose, backdrop, closeButton };
  }

  it("closes from the backdrop and the close button", () => {
    const { onClose, backdrop, closeButton } = mount();
    backdrop.click();
    closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ignores close requests while not dismissible", () => {
    const { onClose, backdrop, closeButton } = mount(false);
    backdrop.click();
    closeButton.click();
    expect(closeButton.disabled).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
  });
});
