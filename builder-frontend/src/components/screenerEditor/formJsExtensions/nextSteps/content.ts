import cloneDeep from "lodash/cloneDeep";
import type { Benefit, NextSteps } from "@/types";
import { normalizeHttpUrl } from "@/utils/httpUrl";

export const NEXT_STEPS_TYPE = "next_steps";
export type BenefitContent = Record<string, NextSteps>;

/** An empty copied record is still missing instructions for the analyst to review. */
export function hasNextStepsContent(content?: NextSteps): boolean {
  return [
    content?.eligible?.applyUrl,
    content?.eligible?.helpUrl,
    content?.eligible?.helpPhone,
    content?.eligible?.body,
    content?.ineligible?.note,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
}

export function copyBenefitContent(benefits: Benefit[]): BenefitContent {
  return Object.fromEntries(
    benefits.map((benefit) => [benefit.id, cloneDeep(benefit.nextSteps ?? {})]),
  );
}

/**
 * Accept only the web links the editor would save, including when a schema was imported
 * by hand. An invalid link is omitted.
 */
export function webLink(value?: string | null): string | undefined {
  return (value && normalizeHttpUrl(value)) || undefined;
}

/** Email and phone links an analyst may write in Markdown. */
export function contactLink(value?: string | null): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (["mailto:", "tel:"].includes(url.protocol) && url.pathname)
      return url.href;
  } catch {
    /* An invalid contact is omitted. */
  }
}
