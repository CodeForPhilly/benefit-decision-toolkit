import type { ScreenerResult } from "@/types";
import type { NextStepsField } from "@/components/screenerEditor/formJsExtensions/nextSteps/NextSteps";
import {
  benefitNextSteps,
  showsDecided,
  type BenefitNextSteps,
} from "@/components/screenerEditor/formJsExtensions/nextSteps/content";

export type CrmNextSteps = Record<string, BenefitNextSteps>;
export type NextStepsProvider = (
  results: ScreenerResult,
) => CrmNextSteps | undefined;

/** Project the saved screener copy, never evaluation-provider content or generated HTML. */
export function projectNextSteps(
  results: ScreenerResult,
  field?: NextStepsField,
): CrmNextSteps | undefined {
  if (!field) return;
  if (!showsDecided(field, Object.values(results))) return {};
  return Object.fromEntries(
    Object.entries(results).flatMap(([id, benefit]) => {
      const steps = benefitNextSteps(benefit, field.benefitContent?.[id]);
      return steps ? [[id, steps]] : [];
    }),
  );
}
