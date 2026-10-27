import cloneDeep from "lodash/cloneDeep";
import type { Benefit, BenefitResult, NextSteps } from "@/types";
import { normalizeHttpUrl } from "@/utils/httpUrl";
import type { NextStepsField } from "./NextSteps";

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

export type Markdown = { format: "markdown"; text: string };
/** A decided benefit's Next steps, as the field shows them and CRM hosts receive them. */
export type BenefitNextSteps = {
  status: "eligible" | "ineligible";
  applyUrl: string | null;
  help: { url: string | null; phone: string | null };
  body: Markdown | null;
  unmetRequirements: string[];
  note: Markdown | null;
};

export const isDecided = (benefit: BenefitResult) =>
  benefit.result === "TRUE" || benefit.result === "FALSE";

/** A whenComplete field shows decided benefits only once every benefit is decided. */
export const showsDecided = (
  field: NextStepsField,
  benefits: BenefitResult[],
) => field.showWhen !== "whenComplete" || benefits.every(isDecided);

const text = (value?: string | null) =>
  typeof value === "string" && value.trim() ? value : null;
const markdown = (value?: string | null): Markdown | null =>
  text(value) ? { format: "markdown", text: value! } : null;

/** Only the saved copy for the benefit's outcome; undefined while undecided. */
export function benefitNextSteps(
  benefit: BenefitResult,
  content?: NextSteps,
): BenefitNextSteps | undefined {
  if (!isDecided(benefit)) return;
  if (benefit.result === "TRUE")
    return {
      status: "eligible",
      applyUrl: webLink(content?.eligible?.applyUrl) ?? null,
      help: {
        url: webLink(content?.eligible?.helpUrl) ?? null,
        phone: text(content?.eligible?.helpPhone)?.trim() ?? null,
      },
      body: markdown(content?.eligible?.body),
      unmetRequirements: [],
      note: null,
    };
  return {
    status: "ineligible",
    applyUrl: null,
    help: { url: null, phone: null },
    body: null,
    unmetRequirements: Object.values(benefit.check_results ?? {})
      .filter((check) => check.result === "FALSE")
      .map((check) => check.aliasName?.trim() || check.name)
      // An unnamed check has nothing to show.
      .filter((name): name is string => !!name?.trim()),
    note: markdown(content?.ineligible?.note),
  };
}
