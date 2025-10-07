import { createResource, createEffect, Accessor } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchScreenerBenefit, updateScreenerBenefit } from "../../../../api/benefit";

import type { Benefit, CheckConfig, ParameterValues } from "../types";


interface ScreenerBenefitsResource {
  benefit: Accessor<Benefit>;
  actions: {
    addCheck: (newCheck: CheckConfig) => void;
    removeCheck: (indexToRemove: number) => void;
    updateCheckConfigParams: (indexToUpdate: number, parameters: ParameterValues) => void;
  };
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (screenerId: Accessor<string>, benefitId: Accessor<string>): ScreenerBenefitsResource => {
  const [benefitResource] = createResource<Benefit, string[]>(
    () => [screenerId(), benefitId()],
    ([sId, bId]) => fetchScreenerBenefit(sId, bId)
  );

  // Local fine-grained store
  const [benefit, setBenefit] = createStore<Benefit | null>(null);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (benefitResource()) {
      console.log("Benefit resource loaded:", benefitResource());
      setBenefit(benefitResource()!);
    }
  });

  // Optimistic update helper
  const updateBenefit = async (newBenefit: Benefit) => {
    const before = benefit;

    setBenefit({ ...newBenefit });

    try {
      const updated = await updateScreenerBenefit(screenerId(), { ...newBenefit });
      setBenefit({ ...updated });
    } catch (e) {
      console.error("Failed to update screener benefits, reverting state", e);
      setBenefit({ ...before });
    }
  };

  // Actions
  const addCheck = (newCheck: CheckConfig) => {
    console.log("Adding check:", newCheck);
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
    initialLoadStatus: {
      loading: () => benefitResource.loading,
      error: () => benefitResource.error,
    },
  };
};

export default createScreenerBenefits;
