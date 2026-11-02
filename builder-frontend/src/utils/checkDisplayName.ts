import { titleCase } from "@/utils/title_case";

import type { CheckResult } from "@/types";

export const checkDisplayName = (
  check: Pick<CheckResult, "aliasName" | "name">,
) => (check.aliasName?.trim() ? titleCase(check.aliasName) : check.name);
