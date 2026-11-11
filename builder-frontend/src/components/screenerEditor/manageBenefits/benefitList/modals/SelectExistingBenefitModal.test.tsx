// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import SelectExistingBenefitModal from "./SelectExistingBenefitModal";
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

  afterEach(() => dispose?.());

  // TODO(Low): Add a test that the list updates when existingBenefitNames changes after an import
  const renderModal = (existingBenefitNames: string[]) => {
    const container = document.createElement("div");
    dispose = render(
      () => (
        <SelectExistingBenefitModal
          importBenefit={async () => {}}
          closeModal={() => {}}
          existingBenefitNames={existingBenefitNames}
        />
      ),
      container,
    );
    return container;
  };

  it("shows every library benefit when the screener has none of them", async () => {
    const container = renderModal([]);
    await flush();

    expect(container.textContent).toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("hides library benefits already in the screener, ignoring case and spaces", async () => {
    const container = renderModal(["  snap "]);
    await flush();

    expect(container.textContent).not.toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("still renders when a screener benefit has no name", async () => {
    const container = renderModal([null as unknown as string]);
    await flush();

    expect(container.textContent).toContain("SNAP");
    expect(container.textContent).toContain("LIHEAP");
  });

  it("says so when every library benefit is already in the screener", async () => {
    const container = renderModal(["SNAP", "LIHEAP"]);
    await flush();

    expect(container.textContent).toContain(
      "All library benefits have already been added to this screener.",
    );
    expect(container.textContent).not.toContain(
      "No library benefits are currently available.",
    );
  });
});
