import type { ScreenerResult } from "@/types";
import { forEachKeyedField, type FormComponent } from "@/utils/formFields";
import { isUnsafeObjectKey } from "@/utils/unsafeObjectKeys";

export type UnansweredQuestions = Readonly<Record<string, readonly string[]>>;
interface Field extends FormComponent {
  label?: string;
  dateLabel?: string;
  timeLabel?: string;
  subtype?: string;
  isRepeating?: boolean;
}
interface Question {
  label: string;
  // Labels of the field's groups, kept only to tell apart fields sharing a label.
  groups: string[];
  // Labels of its repeated sections, outermost first, to number their items.
  repeats: string[];
}
// Which item of each repeated section, outermost first, holds an answer.
type Item = { index: number; count: number };

// Labels only: an expression or template label would evaluate answers into the prompt.
function staticLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return;
  const text = label.trim();
  if (text && !text.startsWith("=") && !/{{[\s\S]*?}}/.test(text)) return text;
}

// A repeated section may hold several answers at the same schema path.
function valuesAt(
  value: unknown,
  segments: string[],
  items: Item[] = [],
): { value: unknown; items: Item[] }[] {
  if (!segments.length) return [{ value, items }];
  if (Array.isArray(value))
    return value.length
      ? value.flatMap((item, index) =>
          valuesAt(item, segments, [...items, { index, count: value.length }]),
        )
      : [{ value: undefined, items }];
  const [key, ...rest] = segments;
  if (!value || typeof value !== "object" || isUnsafeObjectKey(key))
    return [{ value: undefined, items }];
  return valuesAt(
    Object.hasOwn(value, key)
      ? (value as Record<string, unknown>)[key]
      : undefined,
    rest,
    items,
  );
}

/** A form's question labels by input path; build once per schema. */
export type QuestionIndex = ReadonlyMap<string, readonly Question[]>;

export function indexQuestions(schema: {
  components?: Field[];
}): QuestionIndex {
  const questionsAt = new Map<string, Question[]>();
  const labelPaths = new Map<string, Set<string>>();
  forEachKeyedField(schema.components, (field, path, ancestors) => {
    const label = staticLabel(
      field.label ||
        (field.subtype === "time" ? field.timeLabel : field.dateLabel),
    );
    if (!label) return;
    labelPaths.set(label, (labelPaths.get(label) ?? new Set()).add(path));
    questionsAt.set(path, [
      ...(questionsAt.get(path) ?? []),
      {
        label,
        groups: ancestors
          .filter((group) => !group.isRepeating)
          .flatMap((group) => staticLabel(group.label) ?? []),
        repeats: ancestors
          .filter((group) => group.isRepeating)
          .map((group) => staticLabel(group.label) ?? "Entry"),
      },
    ]);
  });
  // Name a field's groups only when another field shares its label.
  for (const questions of questionsAt.values())
    for (const question of questions)
      if (labelPaths.get(question.label)!.size === 1) question.groups = [];
  return questionsAt;
}

// Number a repeated section's items only when it has more than one.
function describe(question: Question, items: Item[]): string {
  const context = [
    ...items.flatMap(({ index, count }, depth) =>
      count > 1 && question.repeats[depth]
        ? [`${question.repeats[depth]} #${index + 1}`]
        : [],
    ),
    ...question.groups,
  ];
  return context.length
    ? `${question.label} (${context.join(", ")})`
    : question.label;
}

/** Labels only: never expose answers, technical paths, or evaluated label templates. */
export function unansweredQuestions(
  questionsAt: QuestionIndex,
  evaluatedAnswers: unknown,
  results: ScreenerResult | undefined,
): UnansweredQuestions {
  return Object.fromEntries(
    Object.entries(results ?? {}).flatMap(([id, benefit]) => {
      if (benefit.result !== "UNABLE_TO_DETERMINE") return [];
      const paths = new Set(
        Object.values(benefit.check_results ?? {})
          .filter((check) => check.result === "UNABLE_TO_DETERMINE")
          .flatMap((check) => check.inputPaths ?? []),
      );
      const questions = new Set<string>();
      for (const path of paths)
        for (const { value, items } of valuesAt(
          evaluatedAnswers,
          path.split("."),
        ))
          // Match what the eligibility service receives: whitespace is sent as typed.
          if (value == null || value === "")
            for (const question of questionsAt.get(path) ?? [])
              questions.add(describe(question, items));
      return questions.size ? [[id, [...questions]]] : [];
    }),
  );
}
