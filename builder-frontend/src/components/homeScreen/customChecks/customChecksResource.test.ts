import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/check", () => ({
  addCheck: vi.fn(),
  archiveCheck: vi.fn(),
  restoreCheck: vi.fn(),
  fetchCheck: vi.fn(),
  updateCheck: vi.fn(),
  fetchUserDefinedChecks: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/utils/renameCheckDmn", () => ({
  renameCheckDmn: vi
    .fn()
    .mockResolvedValue("<definitions>renamed</definitions>"),
}));

vi.mock("solid-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import {
  addCheck,
  fetchCheck,
  fetchUserDefinedChecks,
  restoreCheck,
  updateCheck,
} from "@/api/check";
import customChecksResource from "./customChecksResource";
import type { EligibilityCheck } from "@/types";

describe("customChecksResource", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it("propagates create failures to the modal", async () => {
    const failure = new Error("That check name is already in use.");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(addCheck).mockRejectedValue(failure);

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        resource.actions
          .addNewCheck({
            name: "incomeCheck",
            module: "income",
            description: "Checks income",
            parameterDefinitions: [],
          })
          .then(() => reject(new Error("Expected check creation to fail")))
          .catch((error) => {
            try {
              expect(error).toBe(failure);
              expect(resource.actionInProgress()).toBe(false);
              resolve();
            } catch (assertionError) {
              reject(assertionError);
            } finally {
              dispose();
            }
          });
      });
    });
    expect(consoleError).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to add new check",
      failure,
    );
  });

  it("splits one response into the active and archived lists", async () => {
    const active = { id: "active-id", isArchived: false };
    const archived = { id: "archived-id", isArchived: true };
    vi.mocked(fetchUserDefinedChecks).mockResolvedValue([
      active,
      archived,
    ] as unknown as EligibilityCheck[]);

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        queueMicrotask(() => {
          try {
            expect(fetchUserDefinedChecks).toHaveBeenCalledTimes(1);
            expect(resource.checks()).toEqual([active]);
            expect(resource.archivedChecks()).toEqual([archived]);
            resolve();
          } catch (assertionError) {
            reject(assertionError);
          } finally {
            dispose();
          }
        });
      });
    });
  });

  it("survives a failed fetch instead of throwing out of the effect", async () => {
    vi.mocked(fetchUserDefinedChecks).mockRejectedValue(
      new Error("Fetch failed with status: 500"),
    );

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        queueMicrotask(() => {
          try {
            expect(resource.checks()).toEqual([]);
            expect(resource.archivedChecks()).toEqual([]);
            expect(resource.initialLoadStatus.error()).toBeInstanceOf(Error);
            resolve();
          } catch (assertionError) {
            reject(assertionError);
          } finally {
            dispose();
          }
        });
      });
    });
  });

  it("restores a check and refreshes the check list", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        resource.actions
          .restoreCheck("archived-check-id")
          .then(() => {
            try {
              expect(restoreCheck).toHaveBeenCalledWith("archived-check-id");
              expect(fetchUserDefinedChecks).toHaveBeenCalledWith({
                working: true,
                includeArchived: true,
              });
              expect(resource.actionInProgress()).toBe(false);
              resolve();
            } catch (assertionError) {
              reject(assertionError);
            } finally {
              dispose();
            }
          })
          .catch(reject);
      });
    });
  });

  it("refreshes a stale list without saving when the draft already has the name", async () => {
    vi.mocked(fetchCheck).mockResolvedValue({
      id: "W-check",
      name: "New name",
      dmnModel: "<definitions />",
    } as unknown as EligibilityCheck);

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        queueMicrotask(() => {
          vi.mocked(fetchUserDefinedChecks).mockClear();
          resource.actions
            .renameCheck("W-check", "New name")
            .then(() => {
              try {
                expect(updateCheck).not.toHaveBeenCalled();
                expect(fetchUserDefinedChecks).toHaveBeenCalledOnce();
                expect(resource.actionInProgress()).toBe(false);
                resolve();
              } catch (assertionError) {
                reject(assertionError);
              } finally {
                dispose();
              }
            })
            .catch(reject);
        });
      });
    });
  });

  it("saves the renamed DMN with the new name", async () => {
    vi.mocked(fetchCheck).mockResolvedValue({
      id: "W-check",
      name: "Old name",
      dmnModel: "<definitions />",
    } as unknown as EligibilityCheck);

    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const resource = customChecksResource();
        resource.actions
          .renameCheck("W-check", "New name")
          .then(() => {
            try {
              expect(updateCheck).toHaveBeenCalledWith("W-check", {
                name: "New name",
                dmnModel: "<definitions>renamed</definitions>",
                originalDmnModel: "<definitions />",
              });
              resolve();
            } catch (assertionError) {
              reject(assertionError);
            } finally {
              dispose();
            }
          })
          .catch(reject);
      });
    });
  });
});
