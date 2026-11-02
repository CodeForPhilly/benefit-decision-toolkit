import { titleCase } from "@/utils/title_case";

import type { CheckResult } from "@/types";

// A check's own name reused as an alias, such as PrimaryResidenceRequirement or income_limit.
const isIdentifier = (alias: string) =>
  /^\w+$/.test(alias) && /_|[a-z0-9]{2}[A-Z]/.test(alias);

/** Any other alias is the author's wording, where titleCase would rewrite "Age 18-64". */
export const checkDisplayName = (
  check: Pick<CheckResult, "aliasName" | "name">,
) => {
  const alias = check.aliasName?.trim();
  if (!alias) return check.name;
  return isIdentifier(alias) ? titleCase(alias) : alias;
};
