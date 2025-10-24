import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchCheck, updateCheck } from "@/api/check";

import type { EligibilityCheck, ParameterDefinition } from "@/types";


export interface EligibilityCheckDetailResource {
  eligibilityCheck: () => EligibilityCheck;
  actions: {
    addParameter: (parameterDef: ParameterDefinition) => Promise<void>;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const eligibilityCheckDetailResource = (checkId: Accessor<string>): EligibilityCheckDetailResource => {
  const [eligibilityCheckResource, { refetch }] = createResource(() => checkId(), fetchCheck);
  const [actionInProgress, setActionInProgress] = createSignal<boolean>(false);

  // Local fine-grained store
  const [eligibilityCheck, setEligibilityCheck] = createStore<EligibilityCheck | null>(null);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (eligibilityCheckResource()) {
      setEligibilityCheck(eligibilityCheckResource()!);
    }
  });

  const addParameter = async (parameterDef: ParameterDefinition) => {
    const updatedCheck: EligibilityCheck = { ...eligibilityCheck, parameters: [...eligibilityCheck.parameters, parameterDef] };
    setActionInProgress(true);
    try {
      await updateCheck(updatedCheck);
      await refetch();
    } catch (e) {
      console.error("Failed to add parameter", e);
    }
    setActionInProgress(false);
  };

  return {
    eligibilityCheck: () => eligibilityCheck,
    actions: { addParameter },
    actionInProgress,
    initialLoadStatus: {
      loading: () => eligibilityCheckResource.loading,
      error: () => eligibilityCheckResource.error,
    },
  };
};

export default eligibilityCheckDetailResource;
