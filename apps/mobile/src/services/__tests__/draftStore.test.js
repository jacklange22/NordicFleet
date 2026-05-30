import {
  waxDraftKey,
  testDraftKey,
  getDraft,
  setDraft,
  clearDraft,
  __resetDrafts,
} from '../draftStore';

beforeEach(() => __resetDrafts());

describe('draftStore', () => {
  it('namespaces keys by type and log id', () => {
    expect(waxDraftKey('w1')).toBe('wax:w1');
    expect(testDraftKey('t1')).toBe('test:t1');
    expect(waxDraftKey(null)).toBeNull();
    expect(testDraftKey(undefined)).toBeNull();
  });

  it('sets, gets, and clears a draft', () => {
    setDraft('wax:w1', {notes: 'x'});
    expect(getDraft('wax:w1')).toEqual({notes: 'x'});
    clearDraft('wax:w1');
    expect(getDraft('wax:w1')).toBeUndefined();
  });

  it('ignores a null key on every operation', () => {
    setDraft(null, {a: 1});
    expect(getDraft(null)).toBeUndefined();
    expect(() => clearDraft(null)).not.toThrow();
  });
});
