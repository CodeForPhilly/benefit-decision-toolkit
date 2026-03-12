import type { JSONSchema7 } from "json-schema";

export interface InputPath {
  path: string;
  type: string;
}

/**
 * Mirrors the backend InputSchemaService.transformInputDefinitionSchema.
 * Applies the people-array → personId-keyed-object and enrollments-nesting
 * transformations before path extraction, so paths match what the backend
 * returns from /screener/{id}/form-paths.
 *
 * @param schema - Raw inputDefinition JSONSchema7 from a CheckConfig
 * @param parameters - CheckConfig parameters (may contain personId / peopleIds)
 * @returns Transformed schema suitable for extractInputPaths
 */
export function transformInputDefinitionSchema(
  schema: JSONSchema7 | undefined,
  parameters: Record<string, any> = {}
): JSONSchema7 {
  if (!schema) return {};

  const personIds: string[] = [];
  if (typeof parameters.personId === "string" && parameters.personId) {
    personIds.push(parameters.personId);
  }
  if (Array.isArray(parameters.peopleIds)) {
    for (const id of parameters.peopleIds) {
      if (typeof id === "string" && id) personIds.push(id);
    }
  }

  let result = _transformPeopleSchema(schema, personIds);
  result = _transformEnrollmentsSchema(result, personIds);
  return result;
}

function _transformPeopleSchema(schema: JSONSchema7, personIds: string[]): JSONSchema7 {
  const props = schema.properties;
  if (!props || !props.people || personIds.length === 0) return { ...schema };

  const peopleSchema = props.people as JSONSchema7;
  const itemsSchema = (peopleSchema.items as JSONSchema7) ?? {};

  const newPeopleProps: Record<string, JSONSchema7> = {};
  for (const id of personIds) {
    newPeopleProps[id] = { ...itemsSchema };
  }

  return {
    ...schema,
    properties: { ...props, people: { type: "object", properties: newPeopleProps } },
  };
}

function _transformEnrollmentsSchema(schema: JSONSchema7, personIds: string[]): JSONSchema7 {
  const props = schema.properties;
  if (!props || !props.enrollments || personIds.length === 0) return { ...schema };

  const enrollmentsSchema: JSONSchema7 = { type: "array", items: { type: "string" } };
  const { enrollments: _removed, people, ...restProps } = props as any;
  const existingPeople = (people ?? { type: "object", properties: {} }) as JSONSchema7;
  const existingPeopleProps = (existingPeople.properties ?? {}) as Record<string, JSONSchema7>;

  const newPeopleProps: Record<string, JSONSchema7> = {};
  for (const id of personIds) {
    const existing = existingPeopleProps[id] ?? ({ type: "object", properties: {} } as JSONSchema7);
    newPeopleProps[id] = {
      ...existing,
      properties: {
        ...(existing.properties as Record<string, JSONSchema7> ?? {}),
        enrollments: enrollmentsSchema,
      },
    };
  }

  return {
    ...schema,
    properties: { ...restProps, people: { ...existingPeople, properties: newPeopleProps } },
  };
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
