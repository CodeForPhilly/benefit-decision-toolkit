/*
 * Form-js module that overwrites the "formFields" service.
 * The Module extends FormFields, but has different registration logic
 * to skip certain field types.
 *
 * Based on FormFields from the following location:
 * https://github.com/bpmn-io/form-js/blob/develop/packages/form-js-viewer/src/render/FormFields.js
 */
import { FormFields } from "@bpmn-io/form-js-viewer";

const FIELD_TYPES_TO_SKIP = [
  "documentPreview",
  "expression",
  "file",
  "filepicker",
  "html",
  "iframe",
  "image",
]

class FilterFormComponentsModule extends FormFields {
  register(type: string, formField: any) {
    if (FIELD_TYPES_TO_SKIP.includes(type)) {
      // Skip registering this form field type
      return;
    }
    this._formFields[type] = formField;
  }
}
export default {
  __init__: ['formFields'],
  formFields: ['type', FilterFormComponentsModule]
};
