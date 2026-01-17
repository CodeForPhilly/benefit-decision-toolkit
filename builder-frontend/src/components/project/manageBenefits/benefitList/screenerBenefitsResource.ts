import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

import {
  addCustomBenefit,
  fetchProject,
  removeCustomBenefit,
} from "@/api/screener";

import type { BenefitDetail, CreateCustomBenefitRequest, ScreenerBenefits } from "@/types";


export interface ScreenerBenefitsResource {
  screenerBenefits: () => BenefitDetail[];
  actions: {
    addNewBenefit: (benefit: CreateCustomBenefitRequest) => Promise<void>;
    removeBenefit: (benefitIdToRemove: string) => Promise<void>;
    // copyPublicBenefit: (benefitId: string) => Promise<void>;
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

  // Actions
  const addNewBenefit = async (benefit: CreateCustomBenefitRequest) => {
    setActionInProgress(true);
    try {
      await addCustomBenefit(screenerId(), benefit);
      await refetch();
    } catch (e) {
      console.error("Failed to add new benefit, reverting state", e);
    }
    setActionInProgress(false);
  }

  // const copyPublicBenefit = async (benefitId: string) => {
  //   setActionInProgress(true);
  //   try {
  //     await copyPublicBenefitApi(screenerId(), benefitId);
  //     await refetch();
  //   } catch (e) {
  //     console.error("Failed to add new benefit, reverting state", e);
  //   }
  //   setActionInProgress(false);
  // }

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
      // copyPublicBenefit
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () => screenerResource.loading,
      error: () => screenerResource.error,
    },
  };
};

export default createScreenerBenefits;
