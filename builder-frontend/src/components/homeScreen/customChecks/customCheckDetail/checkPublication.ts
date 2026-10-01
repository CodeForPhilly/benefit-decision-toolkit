import type { CustomCheckWithDmn, EligibilityCheck } from "@/types";
import { fetchCheck, getRelatedPublishedChecks } from "@/api/check";
import { normalizeDmnXml } from "./dmnEditor";

export interface Publication {
  versions: EligibilityCheck[];
  latest?: CustomCheckWithDmn;
}

export function sortPublishedChecks(checks: EligibilityCheck[]) {
  return checks.slice().sort((a, b) => {
    const aParts = a.version.split(".").map(Number);
    const bParts = b.version.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      const difference = (bParts[i] || 0) - (aParts[i] || 0);
      if (difference) return difference;
    }
    return 0;
  });
}

export async function loadPublication(checkId: string): Promise<Publication> {
  const versions = sortPublishedChecks(
    await getRelatedPublishedChecks(checkId),
  );
  const latest = versions.length
    ? ((await fetchCheck(versions[0].id)) as CustomCheckWithDmn)
    : undefined;
  return { versions, latest };
}

// Compare the saved fields that publishing snapshots. The input schema is
// derived from the DMN when publishing, and the id/version identify snapshots.
export function matchesPublishedCheck(
  draft: CustomCheckWithDmn,
  published: CustomCheckWithDmn,
) {
  const parameters = (check: EligibilityCheck) =>
    (check.parameterDefinitions || []).map(({ key, label, type, required }) => [
      key,
      label,
      type,
      required,
    ]);
  return (
    !!draft.dmnModel &&
    !!published.dmnModel &&
    draft.name === published.name &&
    draft.module === published.module &&
    draft.description === published.description &&
    JSON.stringify(parameters(draft)) ===
      JSON.stringify(parameters(published)) &&
    normalizeDmnXml(draft.dmnModel) === normalizeDmnXml(published.dmnModel)
  );
}
