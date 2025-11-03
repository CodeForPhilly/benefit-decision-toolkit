import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchCheck, saveCheckDmn, testCheck, updateCheck } from "@/api/check";

import type { CheckConfig, EligibilityCheckDetail, OptionalBoolean, ParameterDefinition } from "@/types";


export interface EligibilityCheckDetailResource {
  eligibilityCheck: () => EligibilityCheckDetail;
  actions: {
    addParameter: (parameterDef: ParameterDefinition) => Promise<void>;
    updateParameter: (parameterIndex: number, parameterDef: ParameterDefinition) => Promise<void>;
    removeParameter: (parameterIndex: number) => Promise<void>;
    testEligibility: (checkConfg: CheckConfig, inputData: Record<string, any>) => Promise<OptionalBoolean>;
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

  const updateParameter = async (parameterIndex: number, parameterDef: ParameterDefinition) => {
    const updatedParameters = [ ...eligibilityCheck.parameters ];
    updatedParameters[parameterIndex] = parameterDef;
    console.log("updatedParameters", updatedParameters);
    const updatedCheck: EligibilityCheckDetail = { ...eligibilityCheck, parameters: updatedParameters };

    setActionInProgress(true);
    try {
      await updateCheck(updatedCheck);
      await refetch();
    } catch (e) {
      console.error("Failed to update parameter", e);
    }
    setActionInProgress(false);
  };

  const removeParameter = async (parameterIndex: number) => {
    const updatedParameters = [ ...eligibilityCheck.parameters ];
    updatedParameters.splice(parameterIndex, 1);
    const updatedCheck: EligibilityCheckDetail = { ...eligibilityCheck, parameters: updatedParameters };

    setActionInProgress(true);
    try {
      await updateCheck(updatedCheck);
      await refetch();
    } catch (e) {
      console.error("Failed to remove parameter", e);
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

  const testEligibility = async (checkConfg: CheckConfig, inputData: Record<string, any>) => {
    setActionInProgress(true);
    const reponse = await testCheck(eligibilityCheck.id, checkConfg, inputData);
    setActionInProgress(false);
    return reponse;
  };

  return {
    eligibilityCheck: () => eligibilityCheck,
    actions: {
      addParameter,
      updateParameter,
      removeParameter,
      saveDmnModel,
      testEligibility,
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => eligibilityCheckResource.loading,
      error: () => eligibilityCheckResource.error,
    },
  };
};

export default eligibilityCheckDetailResource;
