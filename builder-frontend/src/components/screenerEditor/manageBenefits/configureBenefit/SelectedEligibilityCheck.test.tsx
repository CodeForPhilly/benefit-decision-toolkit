// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, expect, it, vi } from "vitest";
import SelectedEligibilityCheck from "./SelectedEligibilityCheck";
import type { CheckConfig } from "@/types";

let dispose: () => void;
afterEach(() => {
  dispose?.();
  document.body.replaceChildren();
});

const buttonNamed = (name: string) =>
  Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent === name,
  )!;

it("returns focus to the edit button when the explanation modal closes", async () => {
  dispose = render(
    () => (
      <SelectedEligibilityCheck
        checkConfig={() =>
          ({ checkName: "Income", checkVersion: "1.0.0" }) as CheckConfig
        }
        updateCheckConfigParams={vi.fn()}
        updateCheckConfigAlias={null}
        updateCheckConfigExplanation={vi.fn().mockResolvedValue(undefined)}
        onRemove={vi.fn()}
      />
    ),
    document.body,
  );
  const edit = buttonNamed("Edit explanation");

  edit.click();
  buttonNamed("Cancel").click();
  expect(document.activeElement).toBe(edit);

  edit.click();
  document.querySelector("form")!.requestSubmit();
  await vi.waitFor(() => expect(document.querySelector("form")).toBeNull());
  expect(document.activeElement).toBe(edit);
});

it.each([
  ["Age 18-64", "Age 18-64"],
  ["PrimaryResidence", "Primary Residence"],
  [undefined, "Income threshold"],
])("names a check with the alias %s as %s", (aliasName, name) => {
  dispose = render(
    () => (
      <SelectedEligibilityCheck
        checkConfig={() =>
          ({
            checkName: "income-threshold",
            checkVersion: "1.0.0",
            aliasName,
          }) as CheckConfig
        }
        updateCheckConfigParams={vi.fn()}
        updateCheckConfigAlias={null}
        onRemove={vi.fn()}
      />
    ),
    document.body,
  );
  expect(document.querySelector(".text-xl span")?.textContent).toBe(name);
});
