import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import {
  fetchScreenerBenefit,
  addCheckToBenefit,
  removeCheckFromBenefit,
  updateCheckParameters,
  updateCheckAlias
} from "@/api/benefit";

import type { Benefit, ParameterValues } from "@/types";

interface ScreenerBenefitsResource {
  benefit: Accessor<Benefit>;
  actions: {
    addCheck: (checkId: string) => void;
    removeCheck: (checkId: string) => void;
    updateCheckConfigParams: (
      checkId: string,
      parameters: ParameterValues
    ) => void;
    updateCheckConfigAlias: (
      checkId: string,
      aliasName: string | null
    ) => void;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (
  screenerId: Accessor<string>,
  benefitId: Accessor<string>
): ScreenerBenefitsResource => {
  const [benefitResource, { refetch }] = createResource<Benefit, string[]>(
    () => [screenerId(), benefitId()],
    ([sId, bId]) => fetchScreenerBenefit(sId, bId)
  );

  // Local fine-grained store
  const [benefit, setBenefit] = createStore<Benefit | null>(null);

  const [actionInProgress, setActionInProgress] = createSignal<boolean>(false);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (benefitResource()) {
      console.log("Benefit resource loaded:", benefitResource());
      setBenefit(benefitResource()!);
    }
  });

  // Actions
  const addCheck = async (checkId: string) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      await addCheckToBenefit(screenerId(), benefitId(), checkId);
      await refetch();
    } catch (e) {
      console.error("Failed to add check to benefit", e);
    }
    setActionInProgress(false);
  };

  const removeCheck = async (checkId: string) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      await removeCheckFromBenefit(screenerId(), benefitId(), checkId);
      await refetch();
    } catch (e) {
      console.error("Failed to remove check from benefit", e);
    }
    setActionInProgress(false);
  };

  const updateCheckConfigParams = async (
    checkId: string,
    parameters: ParameterValues
  ) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      await updateCheckParameters(screenerId(), benefitId(), checkId, parameters);
      await refetch();
    } catch (e) {
      console.error("Failed to update check parameters", e);
    }
    setActionInProgress(false);
  };

  const updateCheckConfigAlias = async (
    checkId: string,
    aliasName: string | null
  ) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      await updateCheckAlias(screenerId(), benefitId(), checkId, aliasName);
      await refetch();
    } catch (e) {
      console.error("Failed to update check alias", e);
    }
    setActionInProgress(false);
  };

  return {
    benefit: () => benefit,
    actions: {
      addCheck,
      removeCheck,
      updateCheckConfigParams,
      updateCheckConfigAlias,
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => benefitResource.loading,
      error: () => benefitResource.error,
    },
  };
};

export default createScreenerBenefits;
