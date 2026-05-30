const {
  PERMISSION_LEVELS,
  DEFAULT_PERMISSION,
  normalizePermission,
  coachHasAtLeast,
  canView,
  canComment,
  canEdit,
  sanitizeSuggestedChanges,
  buildFleetSuggestionPayload,
  applySuggestedChanges,
} = require('../coachPermissions');

describe('permission ladder', () => {
  test('default is view, not edit', () => {
    expect(DEFAULT_PERMISSION).toBe('view');
    expect(PERMISSION_LEVELS).toEqual(['view', 'comment', 'edit']);
  });

  test('normalizePermission falls back to view', () => {
    expect(normalizePermission('edit')).toBe('edit');
    expect(normalizePermission('nonsense')).toBe('view');
    expect(normalizePermission(undefined)).toBe('view');
  });

  test('coachHasAtLeast respects the ladder', () => {
    expect(coachHasAtLeast('view', 'view')).toBe(true);
    expect(coachHasAtLeast('view', 'comment')).toBe(false);
    expect(coachHasAtLeast('comment', 'comment')).toBe(true);
    expect(coachHasAtLeast('edit', 'comment')).toBe(true);
    expect(coachHasAtLeast('comment', 'edit')).toBe(false);
  });

  test('capability helpers', () => {
    expect(canView('view')).toBe(true);
    expect(canComment('view')).toBe(false);
    expect(canComment('comment')).toBe(true);
    expect(canEdit('comment')).toBe(false);
    expect(canEdit('edit')).toBe(true);
  });
});

describe('sanitizeSuggestedChanges', () => {
  test('keeps scalars and arrays of scalars, drops objects/functions', () => {
    const out = sanitizeSuggestedChanges({
      flex: 75,
      name: 'Cold',
      retired: false,
      glideWaxes: ['HF8', 'HF6'],
      nested: {a: 1},
      fn: () => {},
      bad: [{x: 1}],
    });
    expect(out).toEqual({
      flex: 75,
      name: 'Cold',
      retired: false,
      glideWaxes: ['HF8', 'HF6'],
    });
  });

  test('non-object input yields an empty object', () => {
    expect(sanitizeSuggestedChanges(null)).toEqual({});
    expect(sanitizeSuggestedChanges([1, 2])).toEqual({});
  });
});

describe('buildFleetSuggestionPayload', () => {
  test('builds a pending suggestion with sanitized changes', () => {
    const out = buildFleetSuggestionPayload({
      coachUid: 'c1',
      athleteUid: 'a1',
      targetType: 'ski',
      targetId: 's1',
      suggestedChanges: {flex: 80, evil: {}},
      comment: '  stiffen it  ',
    });
    expect(out).toEqual({
      coachUid: 'c1',
      athleteUid: 'a1',
      targetType: 'ski',
      targetId: 's1',
      suggestedChanges: {flex: 80},
      comment: 'stiffen it',
      status: 'pending',
    });
  });

  test('allows a comment-only suggestion', () => {
    const out = buildFleetSuggestionPayload({
      coachUid: 'c1',
      athleteUid: 'a1',
      targetType: 'waxLog',
      targetId: 'w1',
      comment: 'try a colder glide',
    });
    expect(out.suggestedChanges).toEqual({});
    expect(out.comment).toBe('try a colder glide');
  });

  test('rejects missing uids, self-suggestion, bad target, empty suggestion', () => {
    expect(() => buildFleetSuggestionPayload({})).toThrow(/required/);
    expect(() =>
      buildFleetSuggestionPayload({
        coachUid: 'x',
        athleteUid: 'x',
        targetType: 'ski',
        targetId: 's1',
        comment: 'hi',
      }),
    ).toThrow(/own fleet/);
    expect(() =>
      buildFleetSuggestionPayload({
        coachUid: 'c1',
        athleteUid: 'a1',
        targetType: 'bogus',
        targetId: 's1',
        comment: 'hi',
      }),
    ).toThrow(/targetType/);
    expect(() =>
      buildFleetSuggestionPayload({
        coachUid: 'c1',
        athleteUid: 'a1',
        targetType: 'ski',
        targetId: 's1',
      }),
    ).toThrow(/at least one change or a comment/);
  });
});

describe('applySuggestedChanges', () => {
  test('merges sanitized changes onto a copy of the target', () => {
    const target = {flex: 70, name: 'Warm', notes: 'keep'};
    const merged = applySuggestedChanges(target, {
      suggestedChanges: {flex: 80, bad: {}},
    });
    expect(merged).toEqual({flex: 80, name: 'Warm', notes: 'keep'});
    // original is not mutated
    expect(target.flex).toBe(70);
  });
});
