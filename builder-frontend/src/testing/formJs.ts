import { vi } from "vitest";

/** Helpers for tests that answer a real form-js form the way a person would. */

export const input = (label: string) =>
  Array.from(document.querySelectorAll("label")).find((element) =>
    element.textContent?.trim().startsWith(label),
  )?.control as HTMLInputElement | null | undefined;

// The session waits for answers to stop changing.
export const until = (assertion: () => void) =>
  vi.waitFor(assertion, { timeout: 3000 });

export function answer(label: string, value: string) {
  const field = input(label)!;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  // Leaving the field hands the answer to the form at once, before form-js's typing
  // delay ends or its redraw after an import can reset the field.
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}
