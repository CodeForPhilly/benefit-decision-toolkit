// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import ConfigureCheckModal from "./ConfigureCheckModal";
import type { CheckConfig } from "@/types";

const checkConfig: CheckConfig = {
  checkId: "income-threshold",
  checkName: "income_threshold",
  checkVersion: "1.0.0",
  checkModule: "income",
  checkDescription: "",
  parameters: {},
  parameterDefinitions: [],
  inputDefinition: {},
};

describe("ConfigureCheckModal", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  it("stays open and shows an error when saving fails", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const save = vi.fn().mockRejectedValue(new Error("Bad request"));
    const closeModal = vi.fn();
    dispose = render(
      () => (
        <ConfigureCheckModal
          checkConfig={() => checkConfig}
          confirmLabel="Add check"
          updateCheckConfigParams={save}
          closeModal={closeModal}
        />
      ),
      container,
    );

    clickButton(container, "Add check");
    await vi.waitFor(() =>
      expect(container.textContent).toContain("Could not save this check."),
    );

    expect(save).toHaveBeenCalledOnce();
    expect(closeModal).not.toHaveBeenCalled();
  });

  it("closes after saving succeeds", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const closeModal = vi.fn();
    dispose = render(
      () => (
        <ConfigureCheckModal
          checkConfig={() => checkConfig}
          updateCheckConfigParams={vi.fn().mockResolvedValue(undefined)}
          closeModal={closeModal}
        />
      ),
      container,
    );

    clickButton(container, "Confirm");
    await vi.waitFor(() => expect(closeModal).toHaveBeenCalledOnce());
  });
});

function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}
