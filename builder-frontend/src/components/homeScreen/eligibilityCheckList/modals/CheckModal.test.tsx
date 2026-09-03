// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/check";
import CheckModal from "./CheckModal";

describe("CheckModal", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => dispose?.());

  it("displays a rejected name under the check name input", async () => {
    const container = document.createElement("div");
    const onClose = vi.fn();
    const message =
      'A check named "incomeCheck" in module "income" is archived. Restore it or choose a different name.';

    dispose = renderModal(container, new ApiError(message, 409), onClose);
    await submit(container);

    expect(fieldError(container, "checkName")).toBe(message);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps a failed request out of the check name error", async () => {
    const container = document.createElement("div");
    const onClose = vi.fn();
    const message = "Post failed with status: 503";

    dispose = renderModal(container, new ApiError(message, 503), onClose);
    await submit(container);

    // The name was never the problem, so it must not be blamed for the failure.
    expect(fieldError(container, "checkName")).toBe("");
    expect(container.textContent).toContain(message);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("reports a network failure without blaming the check name", async () => {
    const container = document.createElement("div");
    const onClose = vi.fn();
    const message = "Failed to fetch";

    dispose = renderModal(container, new TypeError(message), onClose);
    await submit(container);

    expect(fieldError(container, "checkName")).toBe("");
    expect(container.textContent).toContain(message);
    expect(onClose).not.toHaveBeenCalled();
  });
});

function renderModal(
  container: HTMLElement,
  failure: Error,
  onClose: () => void,
) {
  return render(
    () => (
      <CheckModal
        onAddCheck={() => Promise.reject(failure)}
        onClose={onClose}
      />
    ),
    container,
  );
}

async function submit(container: HTMLElement) {
  setInput(container, "checkName", "incomeCheck");
  setInput(container, "checkModule", "income");
  setInput(container, "checkDescription", "Checks income");
  container
    .querySelector("form")!
    .dispatchEvent(
      new SubmitEvent("submit", { bubbles: true, cancelable: true }),
    );
  await Promise.resolve();
}

function setInput(container: HTMLElement, name: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(
    `input[name="${name}"]`,
  )!;
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

/* The error slot for a field is the element following that field's wrapper. */
function fieldError(container: HTMLElement, name: string) {
  const input = container.querySelector<HTMLInputElement>(
    `input[name="${name}"]`,
  )!;
  return input.parentElement!.nextElementSibling!.textContent ?? "";
}
