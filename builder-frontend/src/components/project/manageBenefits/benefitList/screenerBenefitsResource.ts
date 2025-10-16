import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import {
  addCustomBenefit,
  copyPublicBenefit as copyPublicBenefitApi,
  fetchProject,
  removeCustomBenefit,
  updateScreener
} from "@/api/screener";

import type { BenefitDetail, ScreenerBenefits } from "@/types";


export interface ScreenerBenefitsResource {
  screenerBenefits: () => BenefitDetail[];
  actions: {
    addNewBenefit: (benefit: BenefitDetail) => Promise<void>;
    removeBenefit: (benefitIdToRemove: string) => Promise<void>;
    copyPublicBenefit: (benefitId: string) => Promise<void>;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (screenerId: Accessor<string>): ScreenerBenefitsResource => {
  const [screenerResource, { refetch }] = createResource(() => screenerId(), fetchProject);
  const [actionInProgress, setActionInProgress] = createSignal<boolean>(false);

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
  const addNewBenefit = async (benefit: BenefitDetail) => {
    setActionInProgress(true);
    try {
      await addCustomBenefit(screenerId(), benefit);
      await refetch();
    } catch (e) {
      console.error("Failed to add new benefit, reverting state", e);
    }
    setActionInProgress(false);
  }

  const copyPublicBenefit = async (benefitId: string) => {
    setActionInProgress(true);
    try {
      await copyPublicBenefitApi(screenerId(), benefitId);
      await refetch();
    } catch (e) {
      console.error("Failed to add new benefit, reverting state", e);
    }
    setActionInProgress(false);
  }

  const removeBenefit = async (benefitIdToRemove: string) => {
    setActionInProgress(true);
    try {
      await removeCustomBenefit(screenerId(), benefitIdToRemove);
      await refetch();
    } catch (e) {
      console.error("Failed to delete new benefit, reverting state", e);
    }
    setActionInProgress(false);
  };

  return {
    screenerBenefits: () => screener.benefits,
    actions: {
      addNewBenefit,
      removeBenefit,
      copyPublicBenefit
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => screenerResource.loading,
      error: () => screenerResource.error,
    },
  };
};

export default createScreenerBenefits;
