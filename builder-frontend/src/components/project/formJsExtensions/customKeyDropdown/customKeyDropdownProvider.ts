import SelectEntry from './bpmn-io-dependencies';


/**
 * Custom properties provider that replaces the path entry
 */
class CustomKeyDropdownProvider {
  private pathOptionsService: any;
  private modeling: any;

  static $inject = ['propertiesPanel', 'pathOptionsService', 'modeling'];

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


      // For Group components, just remove the key field entirely (don't add dropdown)
      if (field.type === 'group') {
        generalGroup.entries = generalGroup.entries.filter(
          (entry: any) => entry.id !== 'path'
        );
      }

      const curKeyEntry = generalGroup.entries.find((entry: any) => entry.id === 'key');
      // Only replace the Key input with dropdown if it exists
      if (curKeyEntry) {
        // Remove the original key entry
        generalGroup.entries = generalGroup.entries.filter(
          (entry: any) => entry.id !== 'key'
        );

        // Add our custom dropdown key entry for non-group components
        generalGroup.entries.unshift({
          ...curKeyEntry,
          component: (props: any) => CustomKeyDropdown({ ...props, pathOptionsService, modeling })
        });
      }
      return groups;
    };
  }
}

function CustomKeyDropdown(props: any) {
  const { element: field, id, pathOptionsService, modeling } = props;

  const getValue = () => { return field.key || '' };
  const setValue = (value: string) => {
    return modeling.editFormField(field, 'key', value);
  };

  const getOptions = () => {
    // Get current field's key so it won't be disabled in the dropdown
    const currentKey = field.key || '';

    // Get options from the injected service, passing current key to exclude from disabling
    const options = pathOptionsService?.getOptions(currentKey) || [];

    // Add empty option
    return [{ value: field.id, label: '(none)' }, ...options];
  };

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
export const customKeyModule = {
  __init__: ['customKeyDropdownProvider'],
  customKeyDropdownProvider: ['type', CustomKeyDropdownProvider]
};
