import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCheck, publishCheck } from "@/api/check";
import customCheckDetailResource from "./customCheckDetailResource";
import type { CustomCheckWithDmn } from "@/types";

vi.mock("@/api/check", () => ({
  fetchCheck: vi.fn(),
  publishCheck: vi.fn(),
  saveCheckDmn: vi.fn(),
  updateCheck: vi.fn(),
  evaluateWorkingCheck: vi.fn(),
  validateCheckDmn: vi.fn(),
}));

const check = {
  id: "W-check",
  name: "Income",
  version: "1.0.0",
  dmnModel: "<definitions />",
} as CustomCheckWithDmn;

describe("customCheckDetailResource publication", () => {
  let dispose: (() => void) | undefined;
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchCheck).mockResolvedValue(check);
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    dispose?.();
    vi.restoreAllMocks();
  });

  async function load() {
    const resource = createRoot((cleanup) => {
      dispose = cleanup;
      return customCheckDetailResource(() => check.id);
    });
    await vi.waitFor(() =>
      expect(resource.eligibilityCheck().id).toBe(check.id),
    );
    return resource;
  }

  it("propagates publication failure and clears the busy state", async () => {
    const resource = await load();
    const error = new Error("Invalid model");
    vi.mocked(publishCheck).mockRejectedValue(error);
    await expect(resource.actions.publishCheck(check.id)).rejects.toBe(error);
    expect(resource.actionInProgress()).toBe(false);
    expect(resource.eligibilityCheck().version).toBe("1.0.0");
  });

  it("updates the draft from the publication response without unmounting the tab", async () => {
    const resource = await load();
    vi.mocked(publishCheck).mockResolvedValue({ ...check, version: "2.0.0" });
    await resource.actions.publishCheck(check.id);
    expect(resource.eligibilityCheck().version).toBe("2.0.0");
    expect(fetchCheck).toHaveBeenCalledOnce();
    expect(resource.actionInProgress()).toBe(false);
  });
});
