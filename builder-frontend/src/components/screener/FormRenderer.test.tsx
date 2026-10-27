// @vitest-environment jsdom
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";
import FormRenderer from "./FormRenderer";

const schema = {
  type: "default",
  id: "Form_test",
  schemaVersion: 18,
  components: [
    {
      type: "checkbox",
      id: "cash",
      key: "custom.wantsExtraCash",
      label: "Interested in cash assistance",
    },
    { type: "textfield", id: "city", key: "custom.city", label: "City" },
    {
      type: "checkbox",
      id: "resident",
      key: "simpleChecks.livesInPhiladelphiaPa",
      label: "Philadelphia resident",
    },
  ],
};

describe("FormRenderer host prefill", () => {
  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    document.body.innerHTML = "";
  });

  it("exports only the currently visible saved content and unregisters on unmount", async () => {
    const register = vi.fn();
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <FormRenderer
          schema={{
            type: "default",
            id: "next-steps-form",
            schemaVersion: 18,
            components: [
              {
                id: "show",
                type: "checkbox",
                key: "show",
                label: "Show instructions",
              },
              {
                id: "next",
                type: "next_steps",
                conditional: { hide: "=not(show)" },
                benefitContent: {
                  benefit: { eligible: { body: "Saved instructions" } },
                },
              },
            ],
          }}
          formData={() => ({ show: true })}
          hiddenQuestionPaths={() => []}
          submitForm={() => {}}
          registerNextStepsProvider={register}
        />
      ),
      container,
    );
    await vi.waitFor(() => expect(register).toHaveBeenCalledOnce());
    const results = {
      benefit: { name: "Benefit", result: "TRUE" as const, check_results: {} },
    };
    const provider = register.mock.calls[0][0];
    expect(provider(results).benefit.body.text).toBe("Saved instructions");
    container
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!
      .click();
    await vi.waitFor(() => expect(provider(results)).toBeUndefined());
    dispose();
    dispose = undefined;
    expect(register).toHaveBeenLastCalledWith(undefined);
  });

  it("evaluates unknown host answers as null until the user answers them", async () => {
    const submitForm = vi.fn();
    const container = document.body.appendChild(document.createElement("div"));
    dispose = render(
      () => (
        <FormRenderer
          schema={schema}
          formData={() => ({
            custom: { wantsExtraCash: null },
            simpleChecks: { livesInPhiladelphiaPa: false },
          })}
          hiddenQuestionPaths={() => []}
          submitForm={submitForm}
          evaluateInitialData
        />
      ),
      container,
    );
    await vi.waitFor(() => expect(submitForm).toHaveBeenCalledOnce());
    expect(submitForm).toHaveBeenLastCalledWith({
      custom: { wantsExtraCash: null, city: null },
      simpleChecks: { livesInPhiladelphiaPa: false },
    });

    const cash = container.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    )!;
    cash.click();
    cash.click();
    await vi.waitFor(() => expect(submitForm).toHaveBeenCalledTimes(2), {
      timeout: 3000,
    });
    expect(submitForm).toHaveBeenLastCalledWith({
      custom: { wantsExtraCash: false, city: null },
      simpleChecks: { livesInPhiladelphiaPa: false },
    });
  });
});
