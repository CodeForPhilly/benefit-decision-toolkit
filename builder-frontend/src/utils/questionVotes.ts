import type { BenefitResult, ScreenerResult } from "@/types";

export function haveSameQuestionPaths(
  previous: readonly string[] | undefined,
  next: readonly string[],
): boolean {
  if (!previous) return false;

  const nextPaths = new Set(next);
  return (
    previous.length === next.length &&
    previous.every((path) => nextPaths.has(path))
  );
}

/**
 * Returns all question paths requested by the checks configured for a benefit.
 */
export function getBenefitQuestionPaths(benefit: BenefitResult): string[] {
  return Array.from(
    new Set(
      Object.values(benefit.check_results).flatMap(
        (check) => check.inputPaths ?? [],
      ),
    ),
  );
}

/**
 * Returns question paths for which every voting benefit is ineligible.
 * Eligible and undetermined benefits continue voting for their questions. A
 * reviewed ineligible benefit temporarily keeps its questions visible.
 */
export function getHiddenQuestionPaths(
  results: ScreenerResult | undefined,
  reviewedBenefits: ReadonlySet<string> = new Set(),
): string[] {
  if (!results) return [];

  const votes = new Map<string, boolean[]>();

  for (const [benefitId, benefit] of Object.entries(results)) {
    const stillNeedsAnswers =
      benefit.result !== "FALSE" || reviewedBenefits.has(benefitId);

    for (const path of getBenefitQuestionPaths(benefit)) {
      const pathVotes = votes.get(path) ?? [];
      pathVotes.push(stillNeedsAnswers);
      votes.set(path, pathVotes);
    }
  }

  return Array.from(votes.entries())
    .filter(([, stillNeededVotes]) =>
      stillNeededVotes.every((vote: boolean) => !vote),
    )
    .map(([path]) => path);
}

/** Returns a copy of a form-js schema without fields at the supplied paths. */
export function hideQuestions(
  schema: any,
  hiddenPaths: readonly string[],
): any {
  const hidden = new Set(hiddenPaths);

  const filterComponents = (components: any[] | undefined): any[] =>
    (components ?? [])
      .filter((component) => !component.key || !hidden.has(component.key))
      .map((component) => {
        const copy = { ...component };
        if (Array.isArray(component.components)) {
          copy.components = filterComponents(component.components);
        }
        return copy;
      });

  return {
    ...schema,
    components: filterComponents(schema?.components),
  };
}
