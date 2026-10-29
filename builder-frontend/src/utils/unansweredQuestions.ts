import type { ScreenerResult } from "@/types";

export type UnansweredQuestions = Readonly<Record<string, readonly string[]>>;
type Field = {
  key?: string;
  path?: string;
  label?: string;
  dateLabel?: string;
  timeLabel?: string;
  subtype?: string;
  components?: Field[];
};

// A repeated section may hold several answers at the same schema path.
function valuesAt(value: unknown, segments: string[]): unknown[] {
  if (!segments.length) return [value];
  if (Array.isArray(value))
    return value.length
      ? value.flatMap((item) => valuesAt(item, segments))
      : [undefined];
  if (!value || typeof value !== "object") return [undefined];
  const [key, ...rest] = segments;
  return valuesAt(
    Object.hasOwn(value, key)
      ? (value as Record<string, unknown>)[key]
      : undefined,
    rest,
  );
}

/** Labels only: never expose answers, technical paths, or evaluated label templates. */
export function unansweredQuestions(
  schema: { components?: Field[] },
  evaluatedAnswers: unknown,
  results: ScreenerResult | undefined,
): UnansweredQuestions {
  const labels = new Map<string, string[]>();
  const visit = (fields: Field[], parent = "") => {
    for (const field of fields) {
      const prefix = [parent, field.path].filter(Boolean).join(".");
      const label =
        field.label ||
        (field.subtype === "time" ? field.timeLabel : field.dateLabel);
      if (
        field.key &&
        typeof label === "string" &&
        label.trim() &&
        !label.trim().startsWith("=") &&
        !/{{[\s\S]*?}}/.test(label)
      ) {
        const path = [prefix, field.key].filter(Boolean).join(".");
        labels.set(path, [...(labels.get(path) ?? []), label.trim()]);
      }
      visit(field.components ?? [], prefix);
    }
  };
  visit(schema.components ?? []);
  return Object.fromEntries(
    Object.entries(results ?? {}).flatMap(([id, benefit]) => {
      if (benefit.result !== "UNABLE_TO_DETERMINE") return [];
      const paths = new Set(
        Object.values(benefit.check_results ?? {})
          .filter((check) => check.result === "UNABLE_TO_DETERMINE")
          .flatMap((check) => check.inputPaths ?? []),
      );
      const questions = new Set<string>();
      for (const path of paths) {
        // Match what the eligibility service receives: whitespace is sent as typed.
        const missing = valuesAt(evaluatedAnswers, path.split(".")).some(
          (value) => value == null || value === "",
        );
        if (missing)
          for (const label of labels.get(path) ?? []) questions.add(label);
      }
      return questions.size ? [[id, [...questions]]] : [];
    }),
  );
}
