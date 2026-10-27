import get from "lodash/get";
import { buildExpressionContext } from "@bpmn-io/form-js-viewer";
import type { NextStepsField } from "./NextSteps";
import { NEXT_STEPS_TYPE } from "./content";

type ExpressionContext = { data: any; this: any; parent: any; i: number[] };

/**
 * Shared by print and CRM exports: the first component in schema order that form-js shows,
 * judged by its and its groups' hide conditions against the current answers, as form-js
 * judges them. Reading conditions rather than mounted fields keeps a re-import from
 * briefly hiding every Next steps component.
 */
export function firstVisibleNextSteps(
  getService: (name: string) => any,
): NextStepsField | undefined {
  const form = getService("formFieldRegistry").getForm();
  if (!form) return;
  const conditionChecker = getService("conditionChecker");
  const pathRegistry = getService("pathRegistry");
  const formFields = getService("formFields");
  const { data, initialData } = getService("form")._getState();
  // The root context form-js renders with: answers minus those hidden by conditions.
  const filtered = {
    ...initialData,
    ...conditionChecker.applyConditions(data, data),
  };
  const find = (
    fields: any[] | undefined,
    context: ExpressionContext,
    indexes: Record<string, number>,
  ): NextStepsField | undefined => {
    for (const field of fields ?? []) {
      const hide = field.conditional?.hide;
      if (
        hide &&
        conditionChecker.check(hide, buildExpressionContext(context)) === true
      )
        continue;
      if (field.type === NEXT_STEPS_TYPE) return field;
      if (
        !formFields.get(field.type)?.config.repeatable ||
        !field.isRepeating
      ) {
        const nested = find(field.components, context, indexes);
        if (nested) return nested;
        continue;
      }
      // A repeated group renders its components once per item, each in its own scope.
      const items = get(data, pathRegistry.getValuePath(field, { indexes }));
      const rows: unknown[] = Array.isArray(items) ? items : [];
      for (const [index, item] of rows.entries()) {
        const nested = find(
          field.components,
          {
            data: context.data,
            this: item,
            parent: buildExpressionContext({ ...context, data: context.this }),
            i: [...context.i, index + 1],
          },
          { ...indexes, [field.id]: index },
        );
        if (nested) return nested;
      }
    }
  };
  return find(
    form.components,
    { data: filtered, this: filtered, parent: null, i: [] },
    {},
  );
}
