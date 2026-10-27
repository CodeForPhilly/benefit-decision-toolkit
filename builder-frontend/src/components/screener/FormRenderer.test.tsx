// @vitest-environment jsdom
import { createSignal } from "solid-js";
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
    // Follows the answers at once, without waiting for form-js to repaint.
    expect(provider(results)).toBeUndefined();
    dispose();
    dispose = undefined;
    expect(register).toHaveBeenLastCalledWith(undefined);
  });

  it("reads visibility from conditions, including groups, while the form re-imports", async () => {
    const register = vi.fn();
    const [hidden, setHidden] = createSignal<string[]>([]);
    const content = (body: string) => ({
      benefit: { eligible: { body } },
    });
    dispose = render(
      () => (
        <FormRenderer
          schema={{
            type: "default",
            id: "next-steps-groups",
            schemaVersion: 18,
            components: [
              { id: "city", type: "textfield", key: "city", label: "City" },
              {
                id: "hiddenGroup",
                type: "group",
                conditional: { hide: "=true" },
                components: [
                  {
                    id: "inHidden",
                    type: "next_steps",
                    benefitContent: content("Hidden group"),
                  },
                ],
              },
              {
                id: "shownGroup",
                type: "group",
                components: [
                  {
                    id: "inShown",
                    type: "next_steps",
                    benefitContent: content("Shown group"),
                  },
                ],
              },
            ],
          }}
          formData={() => ({})}
          hiddenQuestionPaths={hidden}
          submitForm={() => {}}
          registerNextStepsProvider={register}
        />
      ),
      document.body.appendChild(document.createElement("div")),
    );
    await vi.waitFor(() => expect(register).toHaveBeenCalledOnce());
    const results = {
      benefit: { name: "Benefit", result: "TRUE" as const, check_results: {} },
    };
    const provider = register.mock.calls[0][0];
    expect(provider(results).benefit.body.text).toBe("Shown group");
    // Hiding a question re-imports the form; the export must not see a gap.
    setHidden(["city"]);
    expect(provider(results).benefit.body.text).toBe("Shown group");
  });

  it.each([
    [[{ show: false }, { show: true }], "Per item"],
    [[{ show: false }], undefined],
  ])(
    "checks Next steps in a repeated group against each item (%j)",
    async (people, body) => {
      const register = vi.fn();
      dispose = render(
        () => (
          <FormRenderer
            schema={{
              type: "default",
              id: "next-steps-list",
              schemaVersion: 18,
              components: [
                {
                  id: "people",
                  type: "dynamiclist",
                  path: "people",
                  components: [
                    {
                      id: "show",
                      type: "checkbox",
                      key: "show",
                      label: "Show",
                    },
                    {
                      id: "next",
                      type: "next_steps",
                      conditional: { hide: "=not(this.show)" },
                      benefitContent: {
                        benefit: { eligible: { body: "Per item" } },
                      },
                    },
                  ],
                },
              ],
            }}
            formData={() => ({ people })}
            hiddenQuestionPaths={() => []}
            submitForm={() => {}}
            registerNextStepsProvider={register}
          />
        ),
        document.body.appendChild(document.createElement("div")),
      );
      await vi.waitFor(() => expect(register).toHaveBeenCalledOnce());
      const exported = register.mock.calls[0][0]({
        benefit: { name: "Benefit", result: "TRUE", check_results: {} },
      });
      expect(exported?.benefit.body?.text).toBe(body);
    },
  );

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
