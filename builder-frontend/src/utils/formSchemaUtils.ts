interface FormComponent {
  type: string;
  key?: string;
  path?: string;
  components?: FormComponent[];
}

interface FormSchema {
  components: FormComponent[];
}

/**
 * Recursively extracts unique data-binding paths from a Form-JS schema.
 * Handles nested groups and dynamic lists by building dot-separated paths.
 *
 * @param schema - The Form-JS schema object
 * @returns Array of unique dot-separated paths (e.g., ['email', 'person.name', 'person.address.street'])
 */
export function extractFormPaths(schema: FormSchema): string[] {
  const paths = new Set<string>();

  function traverse(components: FormComponent[], parentPath: string = '') {
    for (const component of components) {
      // Build current path prefix (for groups/lists with path property)
      const currentPrefix = component.path
        ? (parentPath ? `${parentPath}.${component.path}` : component.path)
        : parentPath;

      // If component has a key, it's a data field - add its full path
      if (component.key) {
        const fullPath = currentPrefix
          ? `${currentPrefix}.${component.key}`
          : component.key;
        paths.add(fullPath);
      }

      // Recursively process nested components (groups, dynamic lists)
      if (component.components && Array.isArray(component.components)) {
        traverse(component.components, currentPrefix);
      }
    }
  }

  traverse(schema.components || []);
  return Array.from(paths);
}
