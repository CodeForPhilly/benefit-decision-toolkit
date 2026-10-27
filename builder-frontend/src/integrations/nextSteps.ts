import type { ScreenerResult } from "@/types";
import type { NextStepsField } from "@/components/screenerEditor/formJsExtensions/nextSteps/NextSteps";
import { webLink } from "@/components/screenerEditor/formJsExtensions/nextSteps/content";

type Markdown = { format: "markdown"; text: string };
export type CrmNextSteps = Record<
  string,
  {
    status: "eligible" | "ineligible";
    applyUrl: string | null;
    help: { url: string | null; phone: string | null };
    body: Markdown | null;
    unmetRequirements: string[];
    note: Markdown | null;
  }
>;
export type NextStepsProvider = (
  results: ScreenerResult,
) => CrmNextSteps | undefined;

const text = (value?: string | null) =>
  typeof value === "string" && value.trim() ? value : null;
const markdown = (value?: string | null): Markdown | null =>
  text(value) ? { format: "markdown", text: value! } : null;

/** Project the saved screener copy, never evaluation-provider content or generated HTML. */
export function projectNextSteps(
  results: ScreenerResult,
  field?: NextStepsField,
): CrmNextSteps | undefined {
  if (!field) return;
  const benefits = Object.entries(results);
  if (
    field.showWhen === "whenComplete" &&
    benefits.some(([, benefit]) => !["TRUE", "FALSE"].includes(benefit.result))
  )
    return {};
  return Object.fromEntries(
    benefits.flatMap(([id, benefit]) => {
      if (!["TRUE", "FALSE"].includes(benefit.result)) return [];
      const content = field.benefitContent?.[id];
      const eligible = benefit.result === "TRUE";
      return [
        [
          id,
          {
            status: eligible ? "eligible" : "ineligible",
            applyUrl: eligible
              ? (webLink(content?.eligible?.applyUrl) ?? null)
              : null,
            help: {
              url: eligible
                ? (webLink(content?.eligible?.helpUrl) ?? null)
                : null,
              phone: eligible
                ? (text(content?.eligible?.helpPhone)?.trim() ?? null)
                : null,
            },
            body: eligible ? markdown(content?.eligible?.body) : null,
            unmetRequirements: eligible
              ? []
              : Object.values(benefit.check_results ?? {})
                  .filter((check) => check.result === "FALSE")
                  .map((check) => check.aliasName?.trim() || check.name)
                  // An unnamed check has nothing to show the host.
                  .filter((name): name is string => !!name?.trim()),
            note: eligible ? null : markdown(content?.ineligible?.note),
          },
        ],
      ];
    }),
  );
}
