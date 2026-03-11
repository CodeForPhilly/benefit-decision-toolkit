import type { JSONSchema7 } from "json-schema";

export interface InputPath {
  path: string;
  type: string;
}

/**
 * Recursively flattens a JSONSchema7 inputDefinition into dot-separated
 * { path, type } pairs. Types match the keys used in TYPE_COMPATIBILITY
 * (e.g. "string", "number", "boolean", "date", "date-time", "array:string").
 *
 * @param schema - The JSONSchema7 inputDefinition from a CheckConfig
 * @returns Array of { path, type } pairs for every leaf field
 */
export function extractInputPaths(schema: JSONSchema7 | undefined): InputPath[] {
  if (!schema) return [];

  const results: InputPath[] = [];

  function resolveLeafType(node: JSONSchema7): string {
    const type = Array.isArray(node.type)
      ? node.type.find((t) => t !== "null") ?? node.type[0]
      : node.type;
    if (type === "string") {
      if (node.format === "date") return "date";
      if (node.format === "date-time") return "date-time";
      if (node.format === "time") return "time";
    }
    return (type as string) || "string";
  }

  function traverse(node: JSONSchema7, prefix: string) {
    if (node.type === "object" && node.properties) {
      for (const [key, value] of Object.entries(node.properties)) {
        if (typeof value === "boolean") continue;
        traverse(value, prefix ? `${prefix}.${key}` : key);
      }
    } else if (node.type === "array") {
      const items = node.items;
      let itemType = "string";
      if (items && typeof items !== "boolean" && !Array.isArray(items)) {
        itemType = resolveLeafType(items as JSONSchema7);
      }
      if (prefix) results.push({ path: prefix, type: `array:${itemType}` });
    } else {
      if (prefix) results.push({ path: prefix, type: resolveLeafType(node) });
    }
  }

  traverse(schema, "");
  return results;
}

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
