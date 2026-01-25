import { html } from 'htm/preact';
import { useContext } from 'preact/hooks';

import SelectEntry from './customSelectEntry';

import { isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useError, ErrorsContext } from '@bpmn-io/properties-panel';
import { useService } from '@bpmn-io/form-js-editor';


/**
 * Custom properties provider that replaces the path entry
 */
class CustomPathProvider {
  private pathOptionsService: any;
  private modeling: any;

  constructor(propertiesPanel: any, pathOptionsService: any, modeling: any) {
    this.pathOptionsService = pathOptionsService;
    this.modeling = modeling;
    propertiesPanel.registerProvider(this, 500);
  }

  getGroups(field: any, editField: any) {
    const pathOptionsService = this.pathOptionsService;
    const modeling = this.modeling;

    return function(groups: any[]) {
      // Find and modify the general group that contains the path entry
      const generalGroup = groups.find(g => g.id === 'general');

      if (!generalGroup) {
        return groups;
      }

      // Remove the original path entry
      generalGroup.entries = generalGroup.entries.filter(
        (entry: any) => entry.id !== 'key'
      );

      // Add our custom dropdown path entry
      generalGroup.entries.unshift({
        id: 'key',
        component: (props: any) => CustomPathDropdown({ ...props, pathOptionsService, modeling }),
        isEdited: isSelectEntryEdited
      });

      return groups;
    };
  }
}

CustomPathProvider.$inject = ['propertiesPanel', 'pathOptionsService', 'modeling'];

function CustomPathDropdown(props: any) {
  const {
    element: field,
    id,
    pathOptionsService,
    modeling
  } = props;

  const getValue = () => {
    return field.key || '';
  };

  const setValue = (value: string) => {
    return modeling.editFormField(
      field,
      'key',
      value
    );
  };

  const getOptions = () => {
    // Get options from the injected service
    const options = pathOptionsService?.getOptions() || [];

    // Add empty option
    return [
      { value: '', label: '(none)' },
      ...options
    ];
  };

  // const { errors } = useContext(ErrorsContext);
  // console.log(errors["key"]);

  // return (html`
  //   <div>
  //     example
  //   </div>`
  // );

  return SelectEntry({
    element: field,
    id: id || 'key',
    label: 'Key',
    description: 'Select the data path for this field',
    getValue,
    setValue,
    getOptions
  });
}

// Module definition for didi
export const customPathModule = {
  __init__: ['customPathProvider'],
  customPathProvider: ['type', CustomPathProvider]
};
