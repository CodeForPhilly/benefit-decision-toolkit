import { YesNoQuestion } from './YesNoQuestion';
import { ChecklistWithNone } from './ChecklistWithNone';
import { NextSteps } from '../nextSteps/NextSteps';
import { PrintSummary } from '../printSummary/PrintSummary';

/*
 * This is a module definition to register custom
 * form fields with the form-js FormEditor.
 */
class CustomFormFieldsModule {
  constructor(formFields) {
    formFields.register(YesNoQuestion.config.type, YesNoQuestion);
    formFields.register(ChecklistWithNone.config.type, ChecklistWithNone);
    formFields.register(NextSteps.config.type, NextSteps);
    formFields.register(PrintSummary.config.type, PrintSummary);
  }
}

CustomFormFieldsModule.$inject = ["formFields"]

export default {
  __init__: [ 'customFields' ],
  customFields: [ 'type', CustomFormFieldsModule ]
};
