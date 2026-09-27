import { YesNoQuestion } from './YesNoQuestion';
import { ChecklistWithNone } from './ChecklistWithNone';

/*
 * This is a module definition to register custom
 * form fields with the form-js FormEditor.
 */
class CustomFormFieldsModule {
  constructor(formFields) {
    formFields.register(YesNoQuestion.config.type, YesNoQuestion);
    formFields.register(ChecklistWithNone.config.type, ChecklistWithNone);
  }
}

CustomFormFieldsModule.$inject = ["formFields"]

export default {
  __init__: [ 'customFields' ],
  customFields: [ 'type', CustomFormFieldsModule ]
};
