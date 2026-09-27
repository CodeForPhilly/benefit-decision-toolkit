import { html } from 'htm/preact';
import { useContext } from 'preact/hooks';

import { Checklist, FormContext, iconsByType, useExpressionEvaluation } from '@bpmn-io/form-js-viewer';

export const CHECKLIST_WITH_NONE_TYPE = 'checklist_none';
export const NONE_OF_THESE_VALUE = '__bdt_none_of_these__';

/**
 * The marker distinguishes an explicit "None" answer from form-js's default
 * empty checklist value. It is converted to [] before a screener is evaluated.
 */
export function ChecklistWithNone(props: any) {
  const { field, value } = props;
  const { values, valuesExpression, valuesKey } = field;
  const { getService } = useContext(FormContext);
  const initialData = getService('form')._getState().initialData;
  const evaluatedOptions = useExpressionEvaluation(valuesExpression);
  const noneSelected = Array.isArray(value) && value.includes(NONE_OF_THESE_VALUE);
  // Resolve options in the same order as form-js's Checklist: input data,
  // static values, then expression. Pass the result back to Checklist as
  // static values so its built-in renderer places None in the same list.
  const options = valuesKey !== undefined
    ? initialData?.[valuesKey]
    : values !== undefined ? values : evaluatedOptions;
  const { valuesKey: _valuesKey, valuesExpression: _valuesExpression, ...fieldWithoutSource } = field;
  const fieldWithNone = {
    ...fieldWithoutSource,
    values: [
      ...(Array.isArray(options) ? options : []).filter(
        (option: any) => option?.value !== NONE_OF_THESE_VALUE && option !== NONE_OF_THESE_VALUE
      ),
      { label: 'None of these', value: NONE_OF_THESE_VALUE },
    ],
  };

  return html`
    <${Checklist}
      ...${props}
      field=${fieldWithNone}
      onChange=${({ value: selections }: { value: unknown[] }) => {
        const selectedNone = selections.includes(NONE_OF_THESE_VALUE);
        props.onChange({ value: selectedNone
          ? noneSelected
            ? selections.filter((selection) => selection !== NONE_OF_THESE_VALUE)
            : [NONE_OF_THESE_VALUE]
          : selections });
      }}
    />
  `;
}

ChecklistWithNone.config = {
  ...Checklist.config,
  type: CHECKLIST_WITH_NONE_TYPE,
  name: 'Checkbox group with None',
  label: 'Checkbox group with None',
  icon: iconsByType('checklist'),
  // Preserve the internal marker when form-js imports saved answers.
  sanitizeValue: ({ value, ...options }: any) =>
    Array.isArray(value) && value.includes(NONE_OF_THESE_VALUE)
      ? [NONE_OF_THESE_VALUE]
      : Checklist.config.sanitizeValue({ value, ...options }),
  create: (options: any = {}) => ({
    ...Checklist.config.create(options),
    label: 'Checkbox group with None',
    ...options
  }),
  propertiesPanelEntries: [
    'key', 'label', 'description', 'values', 'required', 'disabled', 'readonly'
  ]
};
