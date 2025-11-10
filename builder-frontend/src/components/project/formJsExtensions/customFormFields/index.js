import { YesNoQuestion } from './YesNoQuestion';

/*
 * This is a module definition to register custom
 * form fields with the form-js FormEditor.
 */
class CustomFormFieldsModule {
  constructor(formFields) {
    formFields.register(YesNoQuestion.config.type, YesNoQuestion);
  }
}

export default {
  __init__: [ 'customFields' ],
  customFields: [ 'type', CustomFormFieldsModule ]
};
