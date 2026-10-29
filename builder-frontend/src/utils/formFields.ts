export interface FormComponent {
  type?: string;
  key?: string;
  path?: string;
  components?: FormComponent[];
}

/** Joins path parts, skipping empty ones, as form-js does for group paths and keys. */
export const joinPath = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(".");

/**
 * Calls `visit` for each field with a key, passing the full path checks use to name
 * its input: the paths of its groups and repeated sections, then its key.
 */
export function forEachKeyedField<T extends FormComponent>(
  components: T[] | undefined,
  visit: (field: T, path: string) => void,
  parentPath = "",
): void {
  for (const component of components ?? []) {
    const prefix = joinPath(parentPath, component.path);
    if (component.key) visit(component, joinPath(prefix, component.key));
    forEachKeyedField(component.components as T[] | undefined, visit, prefix);
  }
}
