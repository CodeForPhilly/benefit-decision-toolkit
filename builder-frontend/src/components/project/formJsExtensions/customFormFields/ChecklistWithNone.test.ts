// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { Form } from '@bpmn-io/form-js-viewer';
import CustomFormFieldsModule from './index';
import { NONE_OF_THESE_VALUE } from './ChecklistWithNone';
import { normalizeArrayFieldData } from '@/utils/arrayFieldData';

let form: Form | undefined;

afterEach(() => {
  form?.destroy();
  form = undefined;
  document.body.innerHTML = '';
});

describe('ChecklistWithNone', () => {
  it.each([
    {
      source: 'input data',
      options: { valuesKey: 'benefitOptions' },
      data: { benefitOptions: [{ label: 'Medicaid', value: 'Medicaid' }] },
    },
    {
      source: 'expression',
      options: { valuesExpression: '=[{"label":"Medicaid","value":"Medicaid"}]' },
      data: {},
    },
  ])('places None last when options come from $source', async ({ options, data }) => {
    const schema = {
      components: [{
        type: 'checklist_none',
        id: 'Field_enrollments',
        key: 'enrollments',
        label: 'Benefits',
        description: 'Choose all that apply.',
        ...options,
      }],
      type: 'default',
      id: 'Form_test',
      schemaVersion: 18,
    };
    const container = document.body.appendChild(document.createElement('div'));
    form = new Form({ container, additionalModules: [CustomFormFieldsModule] });
    await form.importSchema(schema, data);

    const optionRows = Array.from(container.querySelectorAll('.fjs-form-field-checklist > .fjs-inline-label'));
    expect(optionRows.map((row) => row.textContent?.trim())).toEqual(['Medicaid', 'None of these']);
    expect(optionRows[1].nextElementSibling?.textContent).toContain('Choose all that apply.');
  });

  it('makes None exclusive and preserves the answer across reimport', async () => {
    const schema = {
      components: [{
        type: 'checklist_none',
        id: 'Field_enrollments',
        key: 'enrollments',
        label: 'Benefits',
        description: 'Choose all that apply.',
        values: [{ label: 'SNAP', value: 'SNAP' }],
      }],
      type: 'default',
      id: 'Form_test',
      schemaVersion: 18,
    };
    const container = document.body.appendChild(document.createElement('div'));
    form = new Form({ container, additionalModules: [CustomFormFieldsModule] });
    await form.importSchema(schema, {});

    const checkboxes = () => Array.from(container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    expect(checkboxes()).toHaveLength(2);
    const optionRows = Array.from(container.querySelectorAll('.fjs-form-field-checklist > .fjs-inline-label'));
    expect(optionRows.map((row) => row.textContent?.trim())).toEqual(['SNAP', 'None of these']);
    expect(optionRows[1].nextElementSibling?.textContent).toContain('Choose all that apply.');

    checkboxes()[1].click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(form._getState().data.enrollments).toEqual([NONE_OF_THESE_VALUE]);

    await form.importSchema(schema, form._getState().data);
    expect(checkboxes()[1].checked).toBe(true);

    checkboxes()[0].click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(form._getState().data.enrollments).toEqual(['SNAP']);
    expect(checkboxes()[1].checked).toBe(false);

    checkboxes()[1].click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(form._getState().data.enrollments).toEqual([NONE_OF_THESE_VALUE]);
    expect(checkboxes()[0].checked).toBe(false);

    expect(normalizeArrayFieldData(schema, form._getState().data).enrollments).toEqual([]);
    checkboxes()[1].click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(normalizeArrayFieldData(schema, form._getState().data).enrollments).toBeNull();
  });
});
