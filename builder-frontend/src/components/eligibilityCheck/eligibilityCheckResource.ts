import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchCheck } from "../../api/check";

import type { EligibilityCheck, ParameterDefinition } from "../project/manageBenefits/types";


export interface ScreenerBenefitsResource {
  eligibilityCheck: () => EligibilityCheck;
  actions: {
    addParameter: (parameterDef: ParameterDefinition) => void;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (checkId: Accessor<string>): ScreenerBenefitsResource => {
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

  const addParameter = (parameterDef: ParameterDefinition) => {
    if (!eligibilityCheck) return;
    setActionInProgress(true);
    setTimeout(() => {
      // Simulate async action
      setEligibilityCheck("parameters", (params) => [...params, parameterDef]);
      setActionInProgress(false);
    }, 500);
  };

  return {
    eligibilityCheck: () => eligibilityCheck,
    actions: {
      addParameter,
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => eligibilityCheckResource.loading,
      error: () => eligibilityCheckResource.error,
    },
  };
};

export default createScreenerBenefits;
