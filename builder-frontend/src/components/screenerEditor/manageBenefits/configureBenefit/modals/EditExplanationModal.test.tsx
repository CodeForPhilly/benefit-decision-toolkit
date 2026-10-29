// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import EditExplanationModal from "./EditExplanationModal";
import type { CheckConfig } from "@/types";

let dispose: () => void;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});

it("keeps a failed save editable, retries, and supports clearing the explanation", async () => {
  const save = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue(undefined);
  const close = vi.fn();
  dispose = render(
    () => (
      <EditExplanationModal
        checkConfig={() =>
          ({ checkName: "Income", explanation: "Saved text" }) as CheckConfig
        }
        save={save}
        closeModal={close}
      />
    ),
    document.body,
  );
  const textarea = document.querySelector("textarea")!;
  expect(textarea.value).toBe("Saved text");
  textarea.value = "  Your income must be below the limit.  ";
  textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
  const submit = () =>
    document
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  submit();
  await vi.waitFor(() =>
    expect(document.querySelector('[role="alert"]')).not.toBeNull(),
  );
  expect(close).not.toHaveBeenCalled();
  expect(textarea.value).toBe("  Your income must be below the limit.  ");
  expect(save).toHaveBeenLastCalledWith("Your income must be below the limit.");
  textarea.value = " ";
  textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
  submit();
  await vi.waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(save).toHaveBeenLastCalledWith(null);
});
