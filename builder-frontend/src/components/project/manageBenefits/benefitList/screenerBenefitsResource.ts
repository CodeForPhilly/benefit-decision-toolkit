import { createResource, createEffect } from "solid-js";
import { createStore } from "solid-js/store";

import { fetchProject, updateScreener } from "../../../../api/screener";

import type { BenefitDetail, ScreenerBenefits } from "../types";


interface ScreenerBenefitsResource {
  screenerBenefits: () => BenefitDetail[];
  actions: {
    addNewBenefit: (benefit: BenefitDetail) => void;
    removeBenefit: (indexToRemove: number) => void;
    updateBenefit: (index: number, updated: Partial<BenefitDetail>) => void;
  };
  initialLoadStatus: {
    loading: boolean;
    error: unknown;
  };
}

const createScreenerBenefits = (projectId: string): ScreenerBenefitsResource => {
  const [screenerResource] = createResource(() => projectId, fetchProject);

  // Local fine-grained store
  const [screener, setScreener] = createStore<ScreenerBenefits>({
    benefits: [],
  });

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (screenerResource()) {
      setScreener(screenerResource()!);
    }
  });

  // Optimistic update helper
  const updateScreenerBenefits = async (newBenefits: BenefitDetail[]) => {
    const before = screener.benefits;

    setScreener("benefits", newBenefits);

    try {
      const updated = await updateScreener({ ...screener, benefits: newBenefits });
      // TODO: setScreener(updated);
    } catch (e) {
      console.error("Failed to update screener benefits, reverting state", e);
      setScreener("benefits", before);
    }
  };

  // Actions
  const addNewBenefit = (benefit: BenefitDetail) =>
    updateScreenerBenefits([...screener.benefits, benefit]);

  const removeBenefit = (indexToRemove: number) =>
    updateScreenerBenefits(
      screener.benefits.filter((_, idx) => idx !== indexToRemove)
    );

  const updateBenefit = (index: number, updated: Partial<BenefitDetail>) => {
    // fine-grained property update (deep reactive!)
    setScreener("benefits", index, (prev) => ({ ...prev, ...updated }));
    // persist to server
    updateScreenerBenefits(screener.benefits);
  };

  return {
    screenerBenefits: () => screener.benefits,
    actions: {
      addNewBenefit,
      removeBenefit,
      updateBenefit
    },
    initialLoadStatus: {
      loading: screenerResource.loading,
      error: screenerResource.error,
    },
  };
};

export default createScreenerBenefits;
