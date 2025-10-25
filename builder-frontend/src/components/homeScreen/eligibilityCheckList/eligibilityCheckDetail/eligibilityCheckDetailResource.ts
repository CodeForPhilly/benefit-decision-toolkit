import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchCheck, saveCheckDmn, updateCheck } from "@/api/check";

import type { EligibilityCheckDetail, ParameterDefinition } from "@/types";


export interface EligibilityCheckDetailResource {
  eligibilityCheck: () => EligibilityCheckDetail;
  actions: {
    addParameter: (parameterDef: ParameterDefinition) => Promise<void>;
    saveDmnModel: (dmnString: string) => Promise<void>;
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
  const [eligibilityCheck, setEligibilityCheck] = createStore<EligibilityCheckDetail | null>(null);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (eligibilityCheckResource()) {
      setEligibilityCheck(eligibilityCheckResource()!);
    }
  });

  const addParameter = async (parameterDef: ParameterDefinition) => {
    const updatedCheck: EligibilityCheckDetail = { ...eligibilityCheck, parameters: [...eligibilityCheck.parameters, parameterDef] };
    setActionInProgress(true);
    try {
      await updateCheck(updatedCheck);
      await refetch();
    } catch (e) {
      console.error("Failed to add parameter", e);
    }
    setActionInProgress(false);
  };

  const saveDmnModel = async (dmnString: string) => {
    setActionInProgress(true);
    try {
      await saveCheckDmn(eligibilityCheck.id, dmnString);
      await refetch();
    } catch (e) {
      console.error("Failed to save DMN model", e);
    }
    setActionInProgress(false);
  }

  return {
    eligibilityCheck: () => eligibilityCheck,
    actions: {
      addParameter,
      saveDmnModel,
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => eligibilityCheckResource.loading,
      error: () => eligibilityCheckResource.error,
    },
  };
};

export default eligibilityCheckDetailResource;
