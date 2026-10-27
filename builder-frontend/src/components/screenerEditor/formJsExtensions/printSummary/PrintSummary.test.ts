// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Form } from "@bpmn-io/form-js-viewer";
import { FormEditor } from "@bpmn-io/form-js-editor";
import CustomFormFieldsModule from "../customFormFields";
import { PrintSummary } from "./PrintSummary";
import {
  screeningResultsModule,
  ScreeningResultsService,
} from "../screeningResults/screeningResults";
import type { ScreenerResult } from "@/types";

let form: Form | FormEditor;
beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  window.dispatchEvent(new Event("afterprint"));
  form?.destroy();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});
const results: ScreenerResult = {
  housing: { name: "Housing", result: "TRUE", check_results: {} },
  food: {
    name: "Food",
    result: "FALSE",
    check_results: {
      income: {
        name: "Income",
        aliasName: "Income limit",
        result: "FALSE",
      } as any,
    },
  },
  utility: {
    name: "Utility help",
    result: "UNABLE_TO_DETERMINE",
    check_results: {},
  },
};
const schema = (showWhen = "whenDecided") => ({
  id: "form",
  type: "default",
  schemaVersion: 18,
  components: [
    {
      id: "answer",
      type: "textfield",
      key: "private",
      label: "Private answer",
    },
    {
      id: "next",
      type: "next_steps",
      showWhen,
      benefitContent: {
        housing: {
          eligible: {
            applyUrl: "https://example.org/apply?program=housing",
            helpPhone: "(215) 555-0100",
            body: "Bring **ID**. [Guide](https://example.org/guide) [Email us](mailto:help@example.org?subject=Housing) [Call us](tel:+12155550199) <https://example.org/office>",
          },
        },
        food: { ineligible: { note: "Ask about other help." } },
        removed: { eligible: { body: "Removed instructions" } },
      },
    },
    { id: "print", type: "print_summary" },
  ],
});
async function mount(showWhen?: string) {
  const container = document.body.appendChild(document.createElement("div"));
  form = new Form({
    container,
    additionalModules: [CustomFormFieldsModule, screeningResultsModule],
  });
  await form.importSchema(schema(showWhen), { private: "Sensitive answer" });
  return {
    container,
    service: form.get<ScreeningResultsService>("screeningResults"),
    button: container.querySelector<HTMLButtonElement>(
      ".bdt-print-summary button",
    )!,
  };
}

it("prints current results and copied content with full URLs, without answers, and cleans up", async () => {
  const { button, service, container } = await mount();
  expect(button.disabled).toBe(true);
  service.setScreenerName("Local benefit screener");
  service.update(results, false);
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  let root!: HTMLElement;
  let printing = false;
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    root = document
      .querySelector(".bdt-print-root")!
      .cloneNode(true) as HTMLElement;
    printing = document.body.classList.contains("bdt-printing");
    window.dispatchEvent(new Event("afterprint"));
  });
  button.click();
  expect(printing).toBe(true);
  expect(root.querySelector("h1")?.textContent).toBe("Local benefit screener");
  expect(root.textContent).toContain(new Date().getFullYear().toString());
  expect(root.textContent).toContain("Housing");
  expect(root.textContent).toContain("Income limit");
  expect(root.textContent).toContain("Ask about other help");
  expect(root.textContent).toContain("Still needs more information");
  expect(root.textContent).toContain(
    "https://example.org/apply?program=housing",
  );
  expect(root.textContent).toContain("https://example.org/guide");
  expect(root.textContent).toContain("Email us (help@example.org)");
  expect(root.textContent).toContain("Call us (+12155550199)");
  expect(root.textContent).toContain("(215) 555-0100");
  expect(root.textContent).toContain("https://example.org/office");
  expect(root.textContent).not.toContain("(https://example.org/office)");
  expect(root.textContent).not.toContain("2155550100");
  expect(root.querySelector("strong")?.textContent).toBe("ID");
  expect(root.textContent).not.toMatch(
    /Sensitive answer|Private answer|Removed instructions/,
  );
  expect(print).toHaveBeenCalledOnce();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(document.querySelector(".bdt-print-root")).toBeNull();
  expect(document.body.classList.contains("bdt-printing")).toBe(false);
  expect(form._getState().data).toEqual({ private: "Sensitive answer" });
});

it("keeps the print tree until the browser reports that printing ended", async () => {
  const { button, service } = await mount();
  service.update(results, false);
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  vi.spyOn(window, "print").mockImplementation(() => {});
  button.click();
  expect(document.querySelector(".bdt-print-root")).not.toBeNull();
  expect(document.body.classList.contains("bdt-printing")).toBe(true);
  // A browser that never sends afterprint must not leave two print trees.
  button.click();
  expect(document.querySelectorAll(".bdt-print-root")).toHaveLength(1);
  window.dispatchEvent(new Event("afterprint"));
  expect(document.querySelector(".bdt-print-root")).toBeNull();
  expect(document.body.classList.contains("bdt-printing")).toBe(false);
});

it("blocks stale and failed results and respects whenComplete in the printout", async () => {
  const { button, service, container } = await mount("whenComplete");
  service.update(results, true);
  await vi.waitFor(() => expect(button.disabled).toBe(true));
  service.update(results, false, true);
  await vi.waitFor(() => expect(button.disabled).toBe(true));
  let root!: HTMLElement;
  const print = vi.spyOn(window, "print").mockImplementation(() => {
    root = document
      .querySelector(".bdt-print-root")!
      .cloneNode(true) as HTMLElement;
  });
  button.click();
  expect(print).not.toHaveBeenCalled();
  service.update(results, false);
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  button.click();
  expect(root.textContent).toContain("Answer the remaining questions");
  expect(root.querySelector("a")).toBeNull();
  expect(print).toHaveBeenCalledOnce();
  expect(container.querySelector('[role="alert"]')).toBeNull();
});

it("recovers from print errors and supports forms with no Next steps component", async () => {
  const { button, service, container } = await mount();
  const withoutNext = schema();
  withoutNext.components = withoutNext.components.filter(
    (field) => field.type !== "next_steps",
  );
  await form.importSchema(withoutNext);
  service.update(results, false);
  const currentButton = container.querySelector<HTMLButtonElement>("button")!;
  await vi.waitFor(() => expect(currentButton.disabled).toBe(false));
  vi.spyOn(window, "print").mockImplementation(() => {
    throw new Error("Printing unavailable");
  });
  currentButton.click();
  await vi.waitFor(() =>
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Please try again",
    ),
  );
  expect(document.querySelector(".bdt-print-root")).toBeNull();
  expect(document.body.classList.contains("bdt-printing")).toBe(false);
});

it("is available in the editor palette, survives save, and does not print sample results", async () => {
  const container = document.body.appendChild(document.createElement("div"));
  form = new FormEditor({
    container,
    additionalModules: [CustomFormFieldsModule, screeningResultsModule],
  });
  await form.importSchema(schema());
  form.get<ScreeningResultsService>("screeningResults").showEditorSamples([]);
  await vi.waitFor(() =>
    expect(container.textContent).toContain("Printing is available in Preview"),
  );
  expect(
    container.querySelector<HTMLButtonElement>(".bdt-print-summary button")
      ?.disabled,
  ).toBe(true);
  expect(container.textContent).toContain("Print summary");
  expect((form as FormEditor).saveSchema().components.at(-1).type).toBe(
    "print_summary",
  );
  expect(PrintSummary.config.create({ id: "new" })).toEqual({ id: "new" });
});

it("checks for stale results again when clicked before the button repaints", async () => {
  const { button, service } = await mount();
  service.update(results, false);
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  service.update(results, true);
  button.click();
  expect(print).not.toHaveBeenCalled();
});

it("uses the first Next steps component in schema order, including nested groups", async () => {
  const { service, container } = await mount();
  const original = schema();
  await form.importSchema({
    ...original,
    components: [
      {
        id: "group",
        type: "group",
        label: "Results",
        components: [original.components[1]],
      },
      {
        id: "other",
        type: "next_steps",
        benefitContent: {
          housing: { eligible: { body: "Other instructions" } },
        },
      },
      original.components[2],
    ],
  });
  service.update(results, false);
  const button = container.querySelector<HTMLButtonElement>(
    ".bdt-print-summary button",
  )!;
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  let text: string | null = null;
  vi.spyOn(window, "print").mockImplementation(() => {
    text = document.querySelector(".bdt-print-root")!.textContent;
  });
  button.click();
  expect(text).toContain("Bring ID");
  expect(text).not.toContain("Other instructions");
});

it("skips Next steps components hidden by a condition", async () => {
  const { service, container } = await mount();
  const original = schema();
  await form.importSchema({
    ...original,
    components: [
      { ...original.components[1], conditional: { hide: "=true" } },
      {
        id: "other",
        type: "next_steps",
        benefitContent: {
          housing: { eligible: { body: "Shown instructions" } },
        },
      },
      original.components[2],
    ],
  });
  service.update(results, false);
  const button = container.querySelector<HTMLButtonElement>(
    ".bdt-print-summary button",
  )!;
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  let text: string | null = null;
  vi.spyOn(window, "print").mockImplementation(() => {
    text = document.querySelector(".bdt-print-root")!.textContent;
  });
  button.click();
  expect(text).toContain("Shown instructions");
  expect(text).not.toContain("Bring ID");
});

it("removes the print tree when navigating away even without afterprint", async () => {
  const { button, service } = await mount();
  service.update(results, false);
  await vi.waitFor(() => expect(button.disabled).toBe(false));
  vi.spyOn(window, "print").mockImplementation(() => {});
  button.click();
  expect(document.querySelector(".bdt-print-root")).not.toBeNull();
  await form.importSchema({
    id: "next-person",
    type: "default",
    schemaVersion: 18,
    components: [],
  });
  expect(document.querySelector(".bdt-print-root")).toBeNull();
  expect(document.body.classList.contains("bdt-printing")).toBe(false);
});
