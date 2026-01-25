interface PathOption {
  value: string;
  label: string;
}

interface EventBus {
  fire(event: string, payload: { options: PathOption[] }): void;
}

export default class PathOptionsService {
  static $inject = ['eventBus'];

  private pathOptions: PathOption[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;

    // Initialize with default options
    this.setOptions([
      { value: 'firstName', label: 'First Name' },
      { value: 'lastName', label: 'Last Name' },
      { value: 'email', label: 'Email' }
    ]);
  }

  setOptions(options: PathOption[]): void {
    this.pathOptions = options;
    this.eventBus.fire('pathOptions.changed', { options });
  }

  getOptions(): PathOption[] {
    return this.pathOptions;
  }
}

export const pathOptionsModule = {
  __init__: ['pathOptionsService'],
  pathOptionsService: ['type', PathOptionsService]
};
