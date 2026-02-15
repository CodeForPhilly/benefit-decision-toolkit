interface PathOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface EventBus {
  fire(event: string, payload: { options: PathOption[] }): void;
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
   * Get options with already-used keys marked as disabled
   * @param currentFieldKey - The key of the current field being edited (won't be disabled)
   */
  getOptions(currentFieldKey?: string): PathOption[] {
    const usedKeys = this.getUsedKeys();

    return this.pathOptions.map(option => ({
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
