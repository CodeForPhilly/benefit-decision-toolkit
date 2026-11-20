// @vitest-environment jsdom

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import SelectExistingBenefitModal from "./SelectExistingBenefitModal";
import { fetchLibraryBenefits } from "@/api/benefit";
import type { Benefit } from "@/types";

const libraryBenefits: Benefit[] = [
  { id: "snap", name: "SNAP", description: "Food assistance", checks: [] },
  { id: "liheap", name: "LIHEAP", description: "Energy help", checks: [] },
];

vi.mock("@/api/benefit", () => ({
  fetchLibraryBenefits: vi.fn(async () => libraryBenefits),
}));

// Let the library benefits resource resolve and the modal re-render.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("SelectExistingBenefitModal", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.innerHTML = "";
  });

  // Takes accessors so tests can change the screener's benefits after rendering
  const renderModal = (
    existingBenefitNames: () => string[],
    importBenefit: (benefitId: string) => Promise<void> = async () => {},
    closeModal: () => void = () => {},
  ) => {
    const container = document.createElement("div");
    // Solid handles onClick at the document, so the container must be in it
    document.body.appendChild(container);
    dispose = render(
      () => (
        <SelectExistingBenefitModal
          importBenefit={importBenefit}
          closeModal={closeModal}
          existingBenefitNames={existingBenefitNames()}
        />
      ),
      container,
    );
    return container;
  };

  it("shows every library benefit when the screener has none of them", async () => {
    const container = renderModal(() => []);
    await flush();

    expect(container.textContent).toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("hides library benefits already in the screener, ignoring case and spaces", async () => {
    const container = renderModal(() => ["  snap "]);
    await flush();

    expect(container.textContent).not.toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("still renders when a screener benefit has no name", async () => {
    const container = renderModal(() => [null as unknown as string]);
    await flush();

    expect(container.textContent).toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("says so when every library benefit is already in the screener", async () => {
    const container = renderModal(() => ["SNAP", "LIHEAP"]);
    await flush();

    expect(container.textContent).toContain(
      "All library benefits have already been added to this screener.",
    );
    expect(container.textContent).not.toContain(
      "No library benefits are currently available.",
    );
  });

  it("updates the list when the screener's benefits change", async () => {
    const [names, setNames] = createSignal<string[]>([]);
    const container = renderModal(names);
    await flush();
    expect(container.textContent).toContain("SNAP");

    setNames(["SNAP"]);

    expect(container.textContent).not.toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("keeps the benefit being added visible until the import finishes", async () => {
    const [names, setNames] = createSignal<string[]>([]);
    let finishImport: () => void = () => {};
    const closeModal = vi.fn();
    const container = renderModal(
      names,
      () => new Promise<void>((resolve) => (finishImport = resolve)),
      closeModal,
    );
    await flush();

    // SNAP is listed first, so its button is the first "Add to screener"
    container.querySelector("button")!.click();
    // The screener refetch lands before importBenefit resolves
    setNames(["SNAP"]);

    expect(container.textContent).toContain("SNAP");
    expect(container.textContent).toContain("Adding...");
    expect(closeModal).not.toHaveBeenCalled();

    finishImport();
    await flush();

    expect(closeModal).toHaveBeenCalledOnce();
  });

  it("shows the load error without crashing", async () => {
    vi.mocked(fetchLibraryBenefits).mockRejectedValueOnce(new Error("boom"));
    const container = renderModal(() => []);
    await flush();

    expect(container.textContent).toContain("Error loading benefits: boom");
    expect(container.textContent).not.toContain(
      "All library benefits have already been added to this screener.",
    );
  });
});
