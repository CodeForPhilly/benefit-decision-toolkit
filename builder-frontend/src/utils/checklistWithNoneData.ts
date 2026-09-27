import {
  CHECKLIST_WITH_NONE_TYPE,
  NONE_OF_THESE_VALUE,
} from '@/components/project/formJsExtensions/customFormFields/ChecklistWithNone';

interface FormComponent {
  type: string;
  key?: string;
  path?: string;
  components?: FormComponent[];
}

/** Convert only the opt-in field's internal value to eligibility input data. */
export function normalizeChecklistWithNoneData<T extends object>(
  schema: { components?: FormComponent[] },
  data: T,
): T {
  const result = structuredClone(data);

  function normalizeAtPath(target: any, segments: string[]) {
    if (Array.isArray(target)) {
      target.forEach((item) => normalizeAtPath(item, segments));
      return;
    }
    if (target === null || typeof target !== 'object') return;

    const [segment, ...rest] = segments;
    if (['__proto__', 'prototype', 'constructor'].includes(segment)) return;
    if (rest.length > 0) {
      target[segment] ??= {};
      normalizeAtPath(target[segment], rest);
      return;
    }

    const value = target[segment];
    // form-js uses [] for an untouched checkbox group. An explicit None
    // answer carries the marker until this evaluation boundary.
    target[segment] = Array.isArray(value) && value.includes(NONE_OF_THESE_VALUE)
      ? []
      : Array.isArray(value) && value.length > 0 ? value : null;
  }

  function visit(components: FormComponent[] | undefined, parentPath = '') {
    for (const component of components ?? []) {
      const prefix = [parentPath, component.path].filter(Boolean).join('.');

      if (component.type === CHECKLIST_WITH_NONE_TYPE && component.key) {
        const path = [prefix, component.key].filter(Boolean).join('.');
        normalizeAtPath(result, path.split('.'));
      }

      visit(component.components, prefix);
    }
  }

  visit(schema?.components);
  return result;
}
