/*
 * File's contents are an augmented version of Radio.js from the following location:
 * https://github.com/bpmn-io/form-js/blob/develop/packages/form-js-viewer/src/render/components/form-fields/Radio.js
 * The Preact component has been modified to create a Yes/No Question form field.
 * 
 * Helper functions [formFieldClasses(...)] and Preact "HTM" syntax taken from the following location:
 * https://github.com/bpmn-io/form-js-examples/blob/master/custom-components/app/extension/render/Range.js
 */
import { html } from 'htm/preact';
import { useRef } from 'preact/hooks';

import classNames from 'classnames';
import isEqual from 'lodash/isEqual';

import { Radio, Description, Errors, Label } from '@bpmn-io/form-js';
import { iconsByType } from '@bpmn-io/form-js-viewer';


const YES_NO_TYPE = "yes_no";

export function YesNoQuestion(props: any) {
  const { disabled, errors = [], domId, onBlur, onFocus, field, readonly, value } = props;
  const { description, label, validate = {} } = field;
  const { required } = validate;

  const descriptionId = `${domId}-description`;
  const errorMessageId = `${domId}-error-message`;

  /* Handle focus/blur */
  const outerDivRef = useRef<HTMLDivElement>();
  const onRadioBlur = (e: FocusEvent) => {
    if (outerDivRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    onBlur && onBlur();
  };
  const onRadioFocus = (e: FocusEvent) => {
    if (outerDivRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    onFocus && onFocus();
  };

  /* Handle options */
  const onChange = (newValue: boolean) => {
    props.onChange({value: newValue});
  };
  const yesNoOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  return (html`
    <div class=${formFieldClasses(YES_NO_TYPE, { errors, disabled, readonly })} ref=${outerDivRef}>
      <${Label} label=${label} required=${required} />
      ${yesNoOptions.map((option, index) => {
        const itemDomId = `${domId}-${index}`;
        const isChecked = isEqual(option.value, value);
        return (html`
          <div
            className=${classNames('fjs-inline-label', {'fjs-checked': isChecked})}
            key=${option.value}>
            <input
              checked=${isChecked}
              class="fjs-input"
              disabled=${disabled}
              readOnly=${readonly}
              name=${domId}
              id=${itemDomId}
              type="radio"
              onClick=${() => onChange(option.value)}
              onBlur=${onRadioBlur}
              onFocus=${onRadioFocus}
              aria-describedby=${[descriptionId, errorMessageId].join(' ')}
              required=${required}
              aria-invalid=${errors.length > 0}
            />
            <${Label}
              htmlFor=${itemDomId}
              label=${option.label}
              class=${classNames({ 'fjs-checked': isChecked })}
              required=${false}
            />
          </div>`
        );
      })}
      <${Description} description=${description} />
      <${Errors} errors=${errors} />
    </div>`
  );
}

YesNoQuestion.config = {
  /* Extend the default configuration of Radio Groups */
  ...Radio.config,
  type: YES_NO_TYPE,
  name: 'Yes/No',
  label: 'Yes/No question',
  icon: iconsByType("radio"),
  group: 'selection',
  propertiesPanelEntries: [
    'key',
    'label',
    'description',
    'disabled',
    'readonly'
  ]
};

function formFieldClasses(type, { errors = [], disabled = false, readonly = false } = {}) {
  if (!type) {
    throw new Error('type required');
  }

  return classNames(
    'fjs-form-field',
    `fjs-form-field-${type}`,
    {
      'fjs-has-errors': errors.length > 0,
      'fjs-disabled': disabled,
      'fjs-readonly': readonly
    }
  );
}
