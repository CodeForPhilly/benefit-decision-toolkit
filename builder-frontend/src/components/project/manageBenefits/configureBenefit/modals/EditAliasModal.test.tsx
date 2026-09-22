// @vitest-environment jsdom

import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import EditAliasModal from "./EditAliasModal";
import type { CheckConfig } from "@/types";

const checkConfig: CheckConfig = {
  checkId: "configured-check",
  checkName: "person-not-enrolled-in-benefit",
  checkVersion: "1.0.0",
  checkModule: "enrollment",
  checkDescription: "",
  parameters: { personId: "client", benefit: "PhlHomesteadExemption" },
  parameterDefinitions: [],
  inputDefinition: {},
  aliasName: "Existing alias",
};

describe("EditAliasModal", () => {
  let dispose: (() => void) | undefined;

  afterEach(() => {
    dispose?.();
    document.body.replaceChildren();
  });

  it("places a generated alias in the editable field without saving it", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const updateAlias = vi.fn();
    const generateAlias = vi
      .fn()
      .mockResolvedValue("Client not already enrolled");
    dispose = render(
      () => (
        <EditAliasModal
          checkConfig={() => checkConfig}
          updateCheckConfigAlias={updateAlias}
          generateCheckConfigAlias={generateAlias}
          closeModal={vi.fn()}
        />
      ),
      container,
    );

    clickButton(container, "Generate alias");
    await Promise.resolve();
    await Promise.resolve();

    expect(generateAlias).toHaveBeenCalledOnce();
    expect(
      container.querySelector<HTMLInputElement>('input[type="text"]')!.value,
    ).toBe("Client not already enrolled");
    expect(updateAlias).not.toHaveBeenCalled();

    clickButton(container, "Save");
    expect(updateAlias).toHaveBeenCalledWith("Client not already enrolled");
  });
});

function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}
