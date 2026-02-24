interface PathOption {
  value: string;
  label: string;
  type: string;
  disabled?: boolean;
}

const TYPE_COMPATIBILITY: Record<string, string[]> = {
  // String types
  'string': ['textfield', 'textarea', 'select', 'radio', 'checklist', 'taglist'],
  // Number types
  'number': ['number'],
  'integer': ['number'],
  // Boolean types
  'boolean': ['checkbox', 'yes_no', 'radio', 'select'],
  // Date/time types
  'date': ['datetime'],
  'date-time': ['datetime'],
  'time': ['datetime'],
  // Array types (arrays of primitives)
  'array:string': ['checklist', 'taglist', 'select'],
  'array:number': ['checklist', 'taglist', 'select'],
  'array:boolean': ['checklist'],
  // Fallback for any/unknown types - compatible with all
  'any': ['textfield', 'textarea', 'number', 'checkbox', 'select', 'radio', 'checklist', 'taglist', 'datetime', 'yes_no'],
};

interface EventBus {
  fire(event: string, payload: { options: PathOption[] }): void;
}

/**
 * Checks if a Form-JS component type is compatible with a JSON Schema type.
 */
export function isTypeCompatible(schemaType: string | undefined, componentType: string): boolean {
  if (!schemaType) {
    return true; // If no schema type, allow all
  }

  const compatibleComponents = TYPE_COMPATIBILITY[schemaType];
  if (!compatibleComponents) {
    // Unknown schema type - allow all to be safe
    return true;
  }

  return compatibleComponents.includes(componentType);
}

export default class PathOptionsService {
  static $inject = ['eventBus', 'formFieldRegistry'];

  private pathOptions: PathOption[] = [];
  private eventBus: EventBus;
  private formFieldRegistry: any;

  constructor(eventBus: EventBus, formFieldRegistry: any) {
    this.eventBus = eventBus;
    this.formFieldRegistry = formFieldRegistry;

    // Initialize with default options
    this.setOptions([]);
  }

  setOptions(options: PathOption[]): void {
    this.pathOptions = options;
    this.eventBus.fire('pathOptions.changed', { options });
  }

  /**
   * Get all keys currently used in the form
   */
  getUsedKeys(): Set<string> {
    const usedKeys = new Set<string>();

    if (!this.formFieldRegistry) {
      return usedKeys;
    }

    // formFieldRegistry.getAll() returns all registered form fields
    const allFields = this.formFieldRegistry.getAll();

    for (const field of allFields) {
      if (field.key) {
        usedKeys.add(field.key);
      }
    }

    return usedKeys;
  }

  /**
   * Get options with already-used keys marked as disabled and filtered by component type.
   * @param currentFieldKey - The key of the current field being edited (won't be disabled)
   * @param componentType - The Form-JS component type to filter compatible options
   */
  getOptions(currentFieldKey?: string, componentType?: string): PathOption[] {
    const usedKeys = this.getUsedKeys();
    console.log(this.pathOptions);

    return this.pathOptions
      .filter(option => {
        // If no component type filter, show all options
        if (!componentType) {
          return true;
        }
        // Filter by type compatibility
        return isTypeCompatible(option.type, componentType);
      })
      .map(option => ({
        ...option,
        disabled: option.value !== currentFieldKey && usedKeys.has(option.value)
      }));
  }

  /**
   * Get all options without filtering (for cases where you need the raw list)
   */
  getAllOptions(): PathOption[] {
    return this.pathOptions;
  }
}

export const pathOptionsModule = {
  __init__: ['pathOptionsService'],
  pathOptionsService: ['type', PathOptionsService]
};
