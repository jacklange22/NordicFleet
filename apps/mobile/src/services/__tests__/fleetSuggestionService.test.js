import firestoreMock from '@react-native-firebase/firestore';
import {
  createSuggestion,
  subscribeSuggestionsForAthlete,
  subscribeSuggestionsFromCoach,
  acceptSuggestion,
  rejectSuggestion,
} from '../fleetSuggestionService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

const base = (overrides = {}) => ({
  coachUid: 'coach',
  athleteUid: 'alice',
  targetType: 'ski',
  targetId: 'ski1',
  suggestedChanges: {flex: 80},
  comment: 'stiffen it',
  ...overrides,
});

describe('fleetSuggestionService', () => {
  describe('createSuggestion', () => {
    it('persists a pending suggestion with sanitized changes', async () => {
      const id = await createSuggestion(
        base({suggestedChanges: {flex: 80, evil: {x: 1}}}),
      );
      const stored = firestoreMock.__getStore().get(`fleetSuggestions/${id}`);
      expect(stored.status).toBe('pending');
      expect(stored.coachUid).toBe('coach');
      expect(stored.athleteUid).toBe('alice');
      expect(stored.suggestedChanges).toEqual({flex: 80}); // nested dropped
      expect(stored.createdAt).toBeDefined();
    });

    it('rejects an empty suggestion (no change, no comment)', async () => {
      await expect(
        createSuggestion(base({suggestedChanges: {}, comment: ''})),
      ).rejects.toThrow(/at least one change or a comment/);
    });
  });

  describe('subscribeSuggestionsForAthlete', () => {
    it('delivers the athlete suggestions newest first', () => {
      firestoreMock.__seedDoc('fleetSuggestions/a', {
        ...base(),
        status: 'pending',
        createdAt: {seconds: 100},
      });
      firestoreMock.__seedDoc('fleetSuggestions/b', {
        ...base(),
        status: 'pending',
        createdAt: {seconds: 200},
      });
      firestoreMock.__seedDoc('fleetSuggestions/c', {
        ...base({athleteUid: 'someone-else'}),
        status: 'pending',
        createdAt: {seconds: 300},
      });
      const cb = jest.fn();
      subscribeSuggestionsForAthlete('alice', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.map(s => s.id)).toEqual(['b', 'a']);
    });
  });

  describe('subscribeSuggestionsFromCoach', () => {
    it('returns only this coach suggestions to the given athlete', () => {
      firestoreMock.__seedDoc('fleetSuggestions/a', {
        ...base(),
        createdAt: {seconds: 100},
      });
      firestoreMock.__seedDoc('fleetSuggestions/b', {
        ...base({athleteUid: 'bob'}),
        createdAt: {seconds: 200},
      });
      const cb = jest.fn();
      subscribeSuggestionsFromCoach('coach', 'alice', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.map(s => s.id)).toEqual(['a']);
    });
  });

  describe('acceptSuggestion', () => {
    it('applies the change to the target and marks accepted', async () => {
      firestoreMock.__seedDoc('users/alice/skis/ski1', {name: 'Ski', flex: 70});
      firestoreMock.__seedDoc('fleetSuggestions/s1', {
        ...base(),
        status: 'pending',
      });
      await acceptSuggestion({id: 's1', ...base()});
      expect(
        firestoreMock.__getStore().get('users/alice/skis/ski1').flex,
      ).toBe(80);
      expect(
        firestoreMock.__getStore().get('fleetSuggestions/s1').status,
      ).toBe('accepted');
    });
  });

  describe('rejectSuggestion', () => {
    it('marks rejected and does not change the target', async () => {
      firestoreMock.__seedDoc('users/alice/skis/ski1', {name: 'Ski', flex: 70});
      firestoreMock.__seedDoc('fleetSuggestions/s1', {
        ...base(),
        status: 'pending',
      });
      await rejectSuggestion('s1');
      expect(
        firestoreMock.__getStore().get('fleetSuggestions/s1').status,
      ).toBe('rejected');
      expect(
        firestoreMock.__getStore().get('users/alice/skis/ski1').flex,
      ).toBe(70);
    });
  });
});
