// Ignores case and surrounding whitespace when comparing names or addresses, and treats a missing value as ""
export const normalizeForComparison = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();
