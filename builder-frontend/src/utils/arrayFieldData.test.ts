import { describe, expect, it } from 'vitest';

import { normalizeArrayFieldData } from './arrayFieldData';
import { NONE_OF_THESE_VALUE } from '@/components/project/formJsExtensions/customFormFields/ChecklistWithNone';

const schema = {
  components: [{
    type: 'checklist_none',
    key: 'people.client.enrollments',
  }],
};

describe('normalizeArrayFieldData', () => {
  it('distinguishes unanswered, explicit None, and selected values', () => {
    expect(normalizeArrayFieldData(schema, { people: { client: {} } })).toEqual({
      people: { client: { enrollments: null } },
    });
    expect(normalizeArrayFieldData(schema, {
      people: { client: { enrollments: [] } },
    })).toEqual({ people: { client: { enrollments: null } } });
    expect(normalizeArrayFieldData(schema, {
      people: { client: { enrollments: [NONE_OF_THESE_VALUE] } },
    })).toEqual({ people: { client: { enrollments: [] } } });
    expect(normalizeArrayFieldData(schema, {
      people: { client: { enrollments: ['SNAP', 'Medicaid'] } },
    })).toEqual({
      people: { client: { enrollments: ['SNAP', 'Medicaid'] } },
    });
  });

  it('sends null for other empty array fields and does not mutate form-js data', () => {
    const data = {
      regular: [] as string[],
      tags: ['a'],
      name: '',
      people: { client: { enrollments: [NONE_OF_THESE_VALUE] } },
    };
    const normalized = normalizeArrayFieldData({
      components: [
        ...schema.components,
        { type: 'checklist', key: 'regular' },
        { type: 'taglist', key: 'tags' },
        { type: 'textfield', key: 'name' },
      ],
    }, data);

    expect(normalized.regular).toBeNull();
    expect(normalized.tags).toEqual(['a']);
    expect(normalized.name).toBe('');
    expect(normalized.people.client.enrollments).toEqual([]);
    expect(data.people.client.enrollments).toEqual([NONE_OF_THESE_VALUE]);
  });

  it('does not create missing parent objects or lists', () => {
    expect(normalizeArrayFieldData(schema, { people: {} })).toEqual({ people: {} });
    expect(normalizeArrayFieldData({
      components: [{
        type: 'dynamiclist',
        path: 'household',
        components: [{ type: 'checklist_none', key: 'enrollments' }],
      }],
    }, {})).toEqual({});
  });

  it('normalizes fields inside repeated groups', () => {
    const data = { household: [{ enrollments: [] }, { enrollments: ['SNAP'] }] };
    expect(normalizeArrayFieldData({
      components: [{
        type: 'dynamiclist',
        path: 'household',
        components: [{ type: 'checklist_none', key: 'enrollments' }],
      }],
    }, data)).toEqual({
      household: [{ enrollments: null }, { enrollments: ['SNAP'] }],
    });
  });
});
