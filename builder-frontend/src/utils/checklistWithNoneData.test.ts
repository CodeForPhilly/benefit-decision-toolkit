import { describe, expect, it } from 'vitest';

import { normalizeChecklistWithNoneData } from './checklistWithNoneData';
import { NONE_OF_THESE_VALUE } from '@/components/project/formJsExtensions/customFormFields/ChecklistWithNone';

const schema = {
  components: [{
    type: 'checklist_none',
    key: 'people.client.enrollments',
  }],
};

describe('normalizeChecklistWithNoneData', () => {
  it('distinguishes unanswered, explicit None, and selected values', () => {
    expect(normalizeChecklistWithNoneData(schema, { people: { client: {} } })).toEqual({
      people: { client: { enrollments: null } },
    });
    expect(normalizeChecklistWithNoneData(schema, {
      people: { client: { enrollments: [] } },
    })).toEqual({ people: { client: { enrollments: null } } });
    expect(normalizeChecklistWithNoneData(schema, {
      people: { client: { enrollments: [NONE_OF_THESE_VALUE] } },
    })).toEqual({ people: { client: { enrollments: [] } } });
    expect(normalizeChecklistWithNoneData(schema, {
      people: { client: { enrollments: ['SNAP', 'Medicaid'] } },
    })).toEqual({
      people: { client: { enrollments: ['SNAP', 'Medicaid'] } },
    });
  });

  it('leaves ordinary checkbox groups alone and does not mutate form-js data', () => {
    const data = { regular: [], people: { client: { enrollments: [NONE_OF_THESE_VALUE] } } };
    const normalized = normalizeChecklistWithNoneData({
      components: [...schema.components, { type: 'checklist', key: 'regular' }],
    }, data);

    expect(normalized.regular).toEqual([]);
    expect(normalized.people.client.enrollments).toEqual([]);
    expect(data.people.client.enrollments).toEqual([NONE_OF_THESE_VALUE]);
  });

  it('does not create missing parent objects or lists', () => {
    expect(normalizeChecklistWithNoneData(schema, { people: {} })).toEqual({ people: {} });
    expect(normalizeChecklistWithNoneData({
      components: [{
        type: 'dynamiclist',
        path: 'household',
        components: [{ type: 'checklist_none', key: 'enrollments' }],
      }],
    }, {})).toEqual({});
  });

  it('normalizes fields inside repeated groups', () => {
    const data = { household: [{ enrollments: [] }, { enrollments: ['SNAP'] }] };
    expect(normalizeChecklistWithNoneData({
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
