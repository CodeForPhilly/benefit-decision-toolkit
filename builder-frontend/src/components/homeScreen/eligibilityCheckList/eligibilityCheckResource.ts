import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import type { EligibilityCheck, CreateCheckRequest } from "@/types";
import { addCheck, archiveCheck, fetchUserDefinedChecks } from "@/api/check";

export interface EligibilityCheckResource {
  checks: () => EligibilityCheck[];
  actions: {
    addNewCheck: (check: CreateCheckRequest) => Promise<void>;
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
  const addNewCheck = async (check: CreateCheckRequest) => {
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
      await archiveCheck(checkIdToRemove);
      await refetch();
    } catch (e) {
      console.error("Failed to archive check", e);
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
