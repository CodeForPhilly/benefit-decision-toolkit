import { createResource, createEffect, Accessor } from "solid-js";
import { createStore } from "solid-js/store";

import { getBenefit, updateBenefit as updateBenefitApi } from "../../../../api/fake_benefit_endpoints";

import type { Benefit, EligibilityCheck, ParameterDefinition } from "../types";


interface ScreenerBenefitsResource {
  benefit: Accessor<Benefit>;
  actions: {
    addCheck: (newCheck: EligibilityCheck) => void;
    removeCheck: (indexToRemove: number) => void;
    updateCheck: (indexToUpdate: number, newCheckData: EligibilityCheck) => void;
  };
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (benefitId: string): ScreenerBenefitsResource => {
  const [benefitResource] = createResource(() => benefitId, getBenefit);  // TODO: fix fetch

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
      const updated = await updateBenefitApi({ ...newBenefit });
      // TODO: setBenefit({ ...updated });
    } catch (e) {
      console.error("Failed to update screener benefits, reverting state", e);
      setBenefit({ ...before });
    }
  };

  // Actions
  const addCheck = (newCheck: EligibilityCheck) => {
    if (!benefit) return;

    const updatedChecks: EligibilityCheck[] = [...benefit.checks, newCheck]
    const updatedBenefit: Benefit = { ...benefit, checks: updatedChecks };
    updateBenefit(updatedBenefit);
  }
  const removeCheck = (indexToRemove: number) => {
    if (!benefit) return;

    const updatedChecks: EligibilityCheck[] = (
      benefit.checks.filter((_, checkIndex) => checkIndex !== indexToRemove)
    );
    const updatedBenefit: Benefit = { ...benefit, checks: updatedChecks };
    updateBenefit(updatedBenefit);
  }
  const updateCheck = (indexToUpdate: number, newCheckData: EligibilityCheck) => {
    if (!benefit) return;

    const updatedChecks: EligibilityCheck[] = benefit.checks.map(
      (check, checkIndex) => {
        if (checkIndex === indexToUpdate) {
          return { ...newCheckData };
        }
        return check;
      }
    );
    const updatedBenefit: Benefit = { ...benefit, checks: updatedChecks };
    updateBenefit(updatedBenefit);
  }

  return {
    benefit: () => benefit,
    actions: {
      addCheck,
      removeCheck,
      updateCheck
    },
    initialLoadStatus: {
      loading: () => benefitResource.loading,
      error: () => benefitResource.error,
    },
  };
};

export default createScreenerBenefits;
