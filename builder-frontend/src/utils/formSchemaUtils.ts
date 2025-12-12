import { JSONSchema7 } from "json-schema";

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

/**
 * Extracts all property paths from a JSON Schema inputDefinition.
 * Recursively traverses nested objects to build dot-separated paths.
 * Excludes the top-level "parameters" property.
 *
 * @param jsonSchema - The JSON Schema to parse
 * @returns Array of dot-separated paths (e.g., ['custom.is_veteran', 'custom.address.street'])
 */
export function extractJsonSchemaPaths(jsonSchema: JSONSchema7): string[] {
  if (!jsonSchema?.properties) {
    return [];
  }

  const paths: string[] = [];

  function traverse(schema: any, parentPath: string = '') {
    if (!schema?.properties) {
      return;
    }

    for (const [key, value] of Object.entries(schema.properties)) {
      // Skip top-level "parameters" property
      if (parentPath === '' && key === 'parameters') {
        continue;
      }

      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const propSchema = value as any;

      // If this property has nested properties, recurse into it
      if (propSchema?.properties) {
        traverse(propSchema, currentPath);
      } else {
        // Leaf property - add the path
        paths.push(currentPath);
      }
    }
  }

  traverse(jsonSchema);
  return paths;
}
