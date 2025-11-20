import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchScreenerBenefit, updateScreenerBenefit } from "@/api/benefit";

import type { Benefit, CheckConfig, ParameterValues } from "@/types";


interface ScreenerBenefitsResource {
  benefit: Accessor<Benefit>;
  actions: {
    addCheck: (newCheck: CheckConfig) => void;
    removeCheck: (indexToRemove: number) => void;
    updateCheckConfigParams: (indexToUpdate: number, parameters: ParameterValues) => void;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (screenerId: Accessor<string>, benefitId: Accessor<string>): ScreenerBenefitsResource => {
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

  // Optimistic update helper
  const updateBenefit = async (newBenefit: Benefit) => {
    setActionInProgress(true);

    try {
      await updateScreenerBenefit(screenerId(), { ...newBenefit });
      await refetch();
    } catch (e) {
      console.error("Failed to update Benefit", e);
    }
    setActionInProgress(false);

  };

  // Actions
  const addCheck = (newCheck: CheckConfig) => {
    if (!benefit) return;

    const updatedChecks: CheckConfig[] = [...benefit.checks, newCheck]
    const updatedBenefit: Benefit = { ...benefit, checks: updatedChecks };
    updateBenefit(updatedBenefit);
  }
  const removeCheck = (indexToRemove: number) => {
    if (!benefit) return;

    const updatedChecks: CheckConfig[] = (
      benefit.checks.filter((_, checkIndex) => checkIndex !== indexToRemove)
    );
    const updatedBenefit: Benefit = { ...benefit, checks: updatedChecks };
    updateBenefit(updatedBenefit);
  }
  const updateCheckConfigParams = (indexToUpdate: number, parameters: ParameterValues) => {
    if (!benefit) return;

    const updatedCheckConfigs: CheckConfig[] = benefit.checks.map(
      (check, checkIndex) => {
        if (checkIndex === indexToUpdate) {
          return { ...check, parameters: parameters};
        }
        return check;
      }
    );
    const updatedBenefit: Benefit = { ...benefit, checks: updatedCheckConfigs };
    updateBenefit(updatedBenefit);
  }

  return {
    benefit: () => benefit,
    actions: {
      addCheck,
      removeCheck,
      updateCheckConfigParams
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => benefitResource.loading,
      error: () => benefitResource.error,
    },
  };
};

export default createScreenerBenefits;
