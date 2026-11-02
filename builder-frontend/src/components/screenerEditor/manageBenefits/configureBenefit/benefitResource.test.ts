// @vitest-environment jsdom
import { createRoot, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import BenefitResource from "./benefitResource";
import {
  addCheckToBenefit,
  fetchScreenerBenefit,
  updateCheckExplanation,
  updateScreenerBenefit,
} from "@/api/benefit";
import type { Benefit, CheckConfig } from "@/types";

vi.mock("@/api/benefit", () => ({
  fetchScreenerBenefit: vi.fn(),
  updateScreenerBenefit: vi.fn(),
  addCheckToBenefit: vi.fn(),
  removeCheckFromBenefit: vi.fn(),
  updateCheckParameters: vi.fn(),
  updateCheckAlias: vi.fn(),
  updateCheckExplanation: vi.fn(),
  generateCheckAlias: vi.fn(),
}));

describe("benefit next-steps updates", () => {
  let dispose: (() => void) | undefined;
  afterEach(() => {
    dispose?.();
    vi.clearAllMocks();
  });

  function setup(checks: CheckConfig[] = []) {
    const benefit: Benefit = {
      id: "benefit-1",
      name: "Benefit",
      description: "Description",
      checks,
    };
    vi.mocked(fetchScreenerBenefit).mockImplementation(
      async (_screenerId, id) => ({ ...benefit, id }),
    );
    let resource!: ReturnType<typeof BenefitResource>;
    let switchBenefit!: (id: string) => void;
    createRoot((cleanup) => {
      dispose = cleanup;
      const [id, setId] = createSignal(benefit.id);
      switchBenefit = setId;
      resource = BenefitResource(() => "screener-1", id);
    });
    return { resource, switchBenefit, benefit };
  }

  it("patches only next steps and keeps the returned benefit in sync", async () => {
    const s = setup();
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    const content = {
      eligible: { body: "Apply here" },
      ineligible: { note: null },
    };
    vi.mocked(updateScreenerBenefit).mockResolvedValue({
      ...s.benefit,
      checks: [],
      nextSteps: content,
    });
    const checks = s.resource.benefit().checks;
    await s.resource.actions.updateNextSteps(content);
    expect(s.resource.benefit().checks).toBe(checks);
    expect(updateScreenerBenefit).toHaveBeenCalledWith(
      "screener-1",
      "benefit-1",
      { nextSteps: content },
    );
    expect(s.resource.benefit().nextSteps).toEqual(content);
    expect(s.resource.actionInProgress()).toBe(false);
    expect(fetchScreenerBenefit).toHaveBeenCalledTimes(1);
  });

  it("keeps saved next steps when an older refetch resolves afterwards", async () => {
    const s = setup();
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    vi.mocked(addCheckToBenefit).mockResolvedValue({ aliasGenerated: true });
    let finishFetch!: (benefit: Benefit) => void;
    vi.mocked(fetchScreenerBenefit).mockReturnValueOnce(
      new Promise((resolve) => {
        finishFetch = resolve;
      }),
    );
    const adding = s.resource.actions.addCheck("check-1", {});
    await vi.waitFor(() =>
      expect(fetchScreenerBenefit).toHaveBeenCalledTimes(2),
    );
    const content = { eligible: { body: "Saved" }, ineligible: null };
    vi.mocked(updateScreenerBenefit).mockResolvedValue({
      ...s.benefit,
      nextSteps: content,
    });
    await s.resource.actions.updateNextSteps(content);
    finishFetch({
      ...s.benefit,
      name: "Refetched",
      nextSteps: { eligible: { body: "Old" } },
    });
    await adding;
    expect(s.resource.benefit().name).toBe("Refetched");
    expect(s.resource.benefit().nextSteps).toEqual(content);
  });

  it("propagates save failures without discarding saved benefit data", async () => {
    const s = setup();
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    vi.mocked(updateScreenerBenefit).mockRejectedValueOnce(
      new Error("Offline"),
    );
    await expect(s.resource.actions.updateNextSteps({})).rejects.toThrow(
      "Offline",
    );
    expect(s.resource.benefit().name).toBe("Benefit");
    expect(s.resource.actionInProgress()).toBe(false);
  });

  it("does not replace a different benefit when an earlier save finishes", async () => {
    const s = setup();
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    let finish!: (benefit: Benefit) => void;
    vi.mocked(updateScreenerBenefit).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const saving = s.resource.actions.updateNextSteps({});
    s.switchBenefit("benefit-2");
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-2"));
    finish(s.benefit);
    await saving;
    expect(s.resource.benefit().id).toBe("benefit-2");
  });

  const checks = [
    { checkId: "check-1", checkName: "Income" },
    { checkId: "check-2", checkName: "Age", explanation: "Be at least 65." },
  ] as CheckConfig[];

  it("shows a saved explanation without reloading or replacing rows", async () => {
    const s = setup(structuredClone(checks));
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    vi.mocked(updateCheckExplanation).mockResolvedValue(undefined);
    const row = s.resource.benefit().checks[0];
    await s.resource.actions.updateCheckConfigExplanation(
      "check-1",
      "Income must be low.",
    );
    expect(updateCheckExplanation).toHaveBeenCalledWith(
      "screener-1",
      "benefit-1",
      "check-1",
      "Income must be low.",
    );
    expect(s.resource.benefit().checks[0]).toBe(row);
    expect(row.explanation).toBe("Income must be low.");
    expect(s.resource.benefit().checks[1].explanation).toBe("Be at least 65.");
    expect(fetchScreenerBenefit).toHaveBeenCalledTimes(1);
  });

  it("keeps a saved explanation when an older refetch resolves afterwards", async () => {
    const s = setup(structuredClone(checks));
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    vi.mocked(addCheckToBenefit).mockResolvedValue({ aliasGenerated: true });
    vi.mocked(updateCheckExplanation).mockResolvedValue(undefined);
    let finishFetch!: (benefit: Benefit) => void;
    vi.mocked(fetchScreenerBenefit).mockReturnValueOnce(
      new Promise((resolve) => {
        finishFetch = resolve;
      }),
    );
    const adding = s.resource.actions.addCheck("check-3", {});
    await vi.waitFor(() =>
      expect(fetchScreenerBenefit).toHaveBeenCalledTimes(2),
    );
    await s.resource.actions.updateCheckConfigExplanation("check-1", "Saved");
    finishFetch({
      ...s.benefit,
      name: "Refetched",
      checks: [
        ...structuredClone(checks),
        { checkId: "check-3", checkName: "Added" } as CheckConfig,
      ],
    });
    await adding;
    expect(s.resource.benefit().name).toBe("Refetched");
    const saved = s.resource.benefit().checks;
    expect(saved.map((check) => check.explanation)).toEqual([
      "Saved",
      "Be at least 65.",
      undefined,
    ]);
  });

  it("keeps rows in place when a refetch returns new objects", async () => {
    const s = setup(structuredClone(checks));
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    const [first, second] = s.resource.benefit().checks;
    vi.mocked(addCheckToBenefit).mockResolvedValue({ aliasGenerated: true });
    vi.mocked(fetchScreenerBenefit).mockResolvedValueOnce({
      ...s.benefit,
      checks: [
        { checkId: "check-3", checkName: "Added" } as CheckConfig,
        { ...structuredClone(checks[1]), aliasName: "Age" },
        structuredClone(checks[0]),
      ],
    });
    await s.resource.actions.addCheck("check-3", {});
    const refreshed = s.resource.benefit().checks;
    expect(refreshed[1]).toBe(second);
    expect(refreshed[2]).toBe(first);
    expect(second.aliasName).toBe("Age");
  });

  it("keeps the explanation when saving fails and rejects for the modal", async () => {
    const s = setup(structuredClone(checks));
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    vi.mocked(updateCheckExplanation).mockRejectedValueOnce(
      new Error("Offline"),
    );
    await expect(
      s.resource.actions.updateCheckConfigExplanation("check-2", null),
    ).rejects.toThrow("Offline");
    expect(s.resource.benefit().checks[1].explanation).toBe("Be at least 65.");
  });

  it("leaves a different benefit alone when an explanation save finishes", async () => {
    const s = setup(structuredClone(checks));
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-1"));
    let finish!: () => void;
    vi.mocked(updateCheckExplanation).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const saving = s.resource.actions.updateCheckConfigExplanation(
      "check-1",
      "Stale",
    );
    s.switchBenefit("benefit-2");
    await vi.waitFor(() => expect(s.resource.benefit()?.id).toBe("benefit-2"));
    finish();
    await saving;
    expect(s.resource.benefit().checks[0].explanation).toBeUndefined();
  });
});
