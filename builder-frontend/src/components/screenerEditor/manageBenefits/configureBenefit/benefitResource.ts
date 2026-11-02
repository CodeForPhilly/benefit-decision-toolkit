import { createResource, createEffect, Accessor, createSignal } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import toast from "solid-toast";

import {
  fetchScreenerBenefit,
  addCheckToBenefit,
  removeCheckFromBenefit,
  updateCheckParameters,
  updateCheckAlias,
  updateCheckExplanation,
  generateCheckAlias,
  updateScreenerBenefit,
} from "@/api/benefit";

import type { Benefit, NextSteps, ParameterValues } from "@/types";

interface ScreenerBenefitsResource {
  benefit: Accessor<Benefit>;
  actions: {
    // Rejects if the check could not be added, so callers can keep the user's input
    addCheck: (checkId: string, parameters: ParameterValues) => Promise<void>;
    removeCheck: (checkId: string) => void;
    updateCheckConfigParams: (
      checkId: string,
      parameters: ParameterValues,
    ) => void;
    updateCheckConfigAlias: (
      checkId: string,
      aliasName: string | null,
      aliasGenerated: boolean,
    ) => void;
    updateCheckConfigExplanation: (
      checkId: string,
      explanation: string | null,
    ) => Promise<void>;
    generateCheckConfigAlias: (checkId: string) => Promise<string>;
    updateNextSteps: (nextSteps: NextSteps) => Promise<void>;
  };
  actionInProgress: Accessor<boolean>;
  initialLoadStatus: {
    loading: Accessor<boolean>;
    error: Accessor<unknown>;
  };
}

const createScreenerBenefits = (
  screenerId: Accessor<string>,
  benefitId: Accessor<string>,
): ScreenerBenefitsResource => {
  // Local fine-grained store
  const [benefit, setBenefit] = createStore<Benefit | null>(null);

  // A refetch that started before a save finished returns the old content.
  let nextStepsSaves = 0;
  let explanationSaves = 0;
  const [benefitResource, { refetch }] = createResource<Benefit, string[]>(
    () => [screenerId(), benefitId()],
    async ([sId, bId]) => {
      const nextStepsBefore = nextStepsSaves;
      const explanationsBefore = explanationSaves;
      const fetched = await fetchScreenerBenefit(sId, bId);
      if (benefit?.id !== fetched.id) return fetched;
      let checks = fetched.checks;
      if (explanationSaves !== explanationsBefore) {
        const explanations = new Map(
          benefit.checks.map((check) => [check.checkId, check.explanation]),
        );
        checks = checks.map((check) =>
          explanations.has(check.checkId)
            ? { ...check, explanation: explanations.get(check.checkId) }
            : check,
        );
      }
      return {
        ...fetched,
        nextSteps:
          nextStepsSaves === nextStepsBefore
            ? fetched.nextSteps
            : benefit.nextSteps,
        checks,
      };
    },
  );

  const [actionInProgress, setActionInProgress] = createSignal<boolean>(false);

  // When resource resolves, sync it into the store
  createEffect(() => {
    if (benefitResource()) {
      console.log("Benefit resource loaded:", benefitResource());
      // Reconciled so rows keep their identity, and any open modal its draft.
      setBenefit(reconcile(benefitResource()!, { key: "checkId" }));
    }
  });

  // Actions
  const addCheck = async (checkId: string, parameters: ParameterValues) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      const { aliasGenerated } = await addCheckToBenefit(
        screenerId(),
        benefitId(),
        checkId,
        parameters,
      );
      if (!aliasGenerated) {
        toast.error(
          "Check added, but an alias couldn't be generated. The check's original name will be shown.",
        );
      }
      await refetch();
    } finally {
      setActionInProgress(false);
    }
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
    parameters: ParameterValues,
  ) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      const { aliasCleared } = await updateCheckParameters(
        screenerId(),
        benefitId(),
        checkId,
        parameters,
      );
      if (aliasCleared) {
        toast.error(
          "Settings saved, but the alias couldn't be updated. The check's original name will be shown.",
        );
      }
      await refetch();
    } catch (e) {
      console.error("Failed to update check parameters", e);
    }
    setActionInProgress(false);
  };

  const updateCheckConfigAlias = async (
    checkId: string,
    aliasName: string | null,
    aliasGenerated: boolean,
  ) => {
    if (!benefit) return;
    setActionInProgress(true);

    try {
      await updateCheckAlias(
        screenerId(),
        benefitId(),
        checkId,
        aliasName,
        aliasGenerated,
      );
      await refetch();
    } catch (e) {
      console.error("Failed to update check alias", e);
    }
    setActionInProgress(false);
  };

  const updateCheckConfigExplanation = async (
    checkId: string,
    explanation: string | null,
  ) => {
    const targetScreenerId = screenerId();
    const targetBenefitId = benefitId();
    await updateCheckExplanation(
      targetScreenerId,
      targetBenefitId,
      checkId,
      explanation,
    );
    // A reload could report a failed read as a failed save, and would re-render every row.
    if (
      screenerId() === targetScreenerId &&
      benefitId() === targetBenefitId
    ) {
      explanationSaves++;
      setBenefit(
        "checks",
        (check) => check.checkId === checkId,
        "explanation",
        explanation,
      );
    }
  };

  const generateCheckConfigAlias = (checkId: string) =>
    generateCheckAlias(screenerId(), benefitId(), checkId);

  const updateNextSteps = async (nextSteps: NextSteps) => {
    const targetScreenerId = screenerId();
    const targetBenefitId = benefitId();
    setActionInProgress(true);
    try {
      const saved = await updateScreenerBenefit(
        targetScreenerId,
        targetBenefitId,
        { nextSteps },
      );
      // Replacing the whole benefit would give checks new references and re-render every row.
      if (
        screenerId() === targetScreenerId &&
        benefitId() === targetBenefitId
      ) {
        nextStepsSaves++;
        setBenefit("nextSteps", saved.nextSteps);
      }
    } finally {
      setActionInProgress(false);
    }
  };

  return {
    benefit: () => benefit,
    actions: {
      addCheck,
      removeCheck,
      updateCheckConfigParams,
      updateCheckConfigAlias,
      generateCheckConfigAlias,
      updateCheckConfigExplanation,
      updateNextSteps,
    },
    actionInProgress,
    initialLoadStatus: {
      loading: () =>
        benefitResource.loading && benefitResource()?.id !== benefitId(),
      error: () => benefitResource.error,
    },
  };
};

export default createScreenerBenefits;
