import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import type { EligibilityCheck } from "@/types";
import { addCheck, fetchUserDefinedChecks } from "@/api/check";

export interface EligibilityCheckResource {
  checks: () => EligibilityCheck[];
  actions: {
    addNewCheck: (check: EligibilityCheck) => Promise<void>;
    removeCheck: (checkIdToRemove: string) => Promise<void>;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const eligibilityCheckResource = (): EligibilityCheckResource => {
  const [checksResource, { refetch }] = createResource(fetchUserDefinedChecks);
  const [actionInProgress, setActionInProgress] = createSignal<boolean>(false);

  // Local fine-grained store
  const [checks, setChecks] = createStore<EligibilityCheck[]>([]);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (checksResource()) {
      setChecks(checksResource()!);
    }
  });

  // Actions
  const addNewCheck = async (check: EligibilityCheck) => {
    setActionInProgress(true);
    try {
      await addCheck(check);
      await refetch();
    } catch (e) {
      console.error("Failed to add new check", e);
    }
    setActionInProgress(false);
  };

  const removeCheck = async (checkIdToRemove: string) => {
    setActionInProgress(true);
    try {
      // await removeCustomBenefit(screenerId(), benefitIdToRemove); TODO
      await refetch();
    } catch (e) {
      console.error("Failed to delete check", e);
    }
    setActionInProgress(false);
  };

  return {
    checks: () => checks,
    actions: { addNewCheck, removeCheck },
    actionInProgress,
    initialLoadStatus: {
      loading: () => checksResource.loading,
      error: () => checksResource.error,
    },
  };
};

export default eligibilityCheckResource;
