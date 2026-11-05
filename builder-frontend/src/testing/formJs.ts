import { vi } from "vitest";

/** Helpers for tests that answer a real form-js form the way a person would. */

export const input = (label: string) =>
  Array.from(document.querySelectorAll("label")).find((element) =>
    element.textContent?.trim().startsWith(label),
  )?.control as HTMLInputElement | null | undefined;

// form-js renders once more just after an import, resetting what was typed before it.
export const settle = () => new Promise((resolve) => setTimeout(resolve, 100));

// The session waits for answers to stop changing.
export const until = (assertion: () => void) =>
  vi.waitFor(assertion, { timeout: 3000 });

export function type(label: string, value: string) {
  const field = input(label)!;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  // Leaving the field hands the answer to the form without form-js's typing delay.
  field.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}
