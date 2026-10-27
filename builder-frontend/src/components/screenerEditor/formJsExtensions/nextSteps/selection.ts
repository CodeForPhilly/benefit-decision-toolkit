import type { NextStepsField } from "./NextSteps";
import { NEXT_STEPS_TYPE } from "./content";

/** Shared by print and CRM exports: use the first rendered component in schema order. */
export function firstVisibleNextSteps(
  fields: any[],
  isShown: (id: string) => boolean,
): NextStepsField | undefined {
  for (const field of fields) {
    if (field.type === NEXT_STEPS_TYPE && isShown(field.id)) return field;
    const nested = firstVisibleNextSteps(field.components ?? [], isShown);
    if (nested) return nested;
  }
}
