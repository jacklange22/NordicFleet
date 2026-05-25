import firestoreMock from '@react-native-firebase/firestore';
import {
  requestCoach,
  cancelRequest,
  respondToRequest,
  endRequest,
  subscribePendingRequestsForCoach,
  subscribeOutgoingRequestsForAthlete,
  syncCoachIdFromRequests,
} from '../coachRequestService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

const seedCoach = (uid, email) => {
  firestoreMock.__seedDoc(`users/${uid}`, {
    email,
    role: 'coach',
  });
};

describe('coachRequestService', () => {
  describe('requestCoach', () => {
    it('throws when athleteUid is missing', async () => {
      await expect(requestCoach()).rejects.toThrow('athleteUid is required');
    });

    it('throws coach/not-found when the email isn\'t a registered coach', async () => {
      await expect(
        requestCoach('a1', 'a@b.com', 'ghost@nordicfleet.test'),
      ).rejects.toMatchObject({code: 'coach/not-found'});
    });

    it('throws coach/self-link when the athlete enters their own email', async () => {
      seedCoach('a1', 'a@b.com');
      // (rare — a coach who's also their own email — but the validator
      //  still trips on athleteUid === coachUid)
      await expect(
        requestCoach('a1', 'a@b.com', 'a@b.com'),
      ).rejects.toMatchObject({code: 'coach/self-link'});
    });

    it('creates a pending request and returns the id + coachUid', async () => {
      seedCoach('c1', 'coach@b.com');
      const {requestId, coachUid} = await requestCoach(
        'a1',
        'a@b.com',
        'coach@b.com',
      );
      expect(coachUid).toBe('c1');
      const stored = firestoreMock.__getStore().get(`coachRequests/${requestId}`);
      expect(stored.status).toBe('pending');
      expect(stored.athleteUid).toBe('a1');
      expect(stored.coachUid).toBe('c1');
      expect(stored.athleteEmail).toBe('a@b.com');
      expect(stored.coachEmail).toBe('coach@b.com');
    });

    it('throws coach/already-requested on duplicate active request', async () => {
      seedCoach('c1', 'coach@b.com');
      await requestCoach('a1', 'a@b.com', 'coach@b.com');
      await expect(
        requestCoach('a1', 'a@b.com', 'coach@b.com'),
      ).rejects.toMatchObject({code: 'coach/already-requested'});
    });

    it('allows a fresh request after the previous was cancelled', async () => {
      seedCoach('c1', 'coach@b.com');
      const {requestId} = await requestCoach('a1', 'a@b.com', 'coach@b.com');
      await cancelRequest(requestId);
      await expect(
        requestCoach('a1', 'a@b.com', 'coach@b.com'),
      ).resolves.toBeDefined();
    });
  });

  describe('respondToRequest', () => {
    it('accept flips status to accepted', async () => {
      firestoreMock.__seedDoc('coachRequests/r1', {
        status: 'pending',
        athleteUid: 'a1',
        coachUid: 'c1',
      });
      await respondToRequest('r1', true);
      expect(firestoreMock.__getStore().get('coachRequests/r1').status).toBe(
        'accepted',
      );
    });

    it('decline flips status to declined', async () => {
      firestoreMock.__seedDoc('coachRequests/r1', {
        status: 'pending',
        athleteUid: 'a1',
        coachUid: 'c1',
      });
      await respondToRequest('r1', false);
      expect(firestoreMock.__getStore().get('coachRequests/r1').status).toBe(
        'declined',
      );
    });
  });

  describe('endRequest', () => {
    it('marks an accepted request as ended', async () => {
      firestoreMock.__seedDoc('coachRequests/r1', {
        status: 'accepted',
        athleteUid: 'a1',
        coachUid: 'c1',
      });
      await endRequest('r1');
      expect(firestoreMock.__getStore().get('coachRequests/r1').status).toBe(
        'ended',
      );
    });
  });

  describe('subscribe helpers', () => {
    it('subscribePendingRequestsForCoach fires with empty array for missing uid', () => {
      const cb = jest.fn();
      const unsub = subscribePendingRequestsForCoach(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
      unsub();
    });

    it('subscribeOutgoingRequestsForAthlete fires with empty array for missing uid', () => {
      const cb = jest.fn();
      const unsub = subscribeOutgoingRequestsForAthlete(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
      unsub();
    });

    it('subscribePendingRequestsForCoach delivers seeded pending requests', () => {
      firestoreMock.__seedDoc('coachRequests/r1', {
        status: 'pending',
        athleteUid: 'a1',
        coachUid: 'c1',
      });
      firestoreMock.__seedDoc('coachRequests/r2', {
        status: 'accepted',
        athleteUid: 'a2',
        coachUid: 'c1',
      });
      const cb = jest.fn();
      const unsub = subscribePendingRequestsForCoach('c1', cb);
      const lastCall = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(lastCall.length).toBe(1);
      expect(lastCall[0].id).toBe('r1');
      unsub();
    });
  });

  describe('syncCoachIdFromRequests', () => {
    it('sets coachId to the most recent accepted request', async () => {
      firestoreMock.__seedDoc('users/a1', {role: 'athlete', coachId: null});
      await syncCoachIdFromRequests('a1', [
        {coachUid: 'c1', status: 'accepted', updatedAt: {seconds: 100}},
        {coachUid: 'c2', status: 'declined', updatedAt: {seconds: 200}},
      ]);
      expect(firestoreMock.__getStore().get('users/a1').coachId).toBe('c1');
    });

    it('clears coachId when no accepted requests remain', async () => {
      firestoreMock.__seedDoc('users/a1', {role: 'athlete', coachId: 'c1'});
      await syncCoachIdFromRequests('a1', [
        {coachUid: 'c1', status: 'ended', updatedAt: {seconds: 100}},
      ]);
      expect(firestoreMock.__getStore().get('users/a1').coachId).toBeNull();
    });

    it('picks the latest by updatedAt when multiple accepted', async () => {
      firestoreMock.__seedDoc('users/a1', {role: 'athlete', coachId: null});
      await syncCoachIdFromRequests('a1', [
        {coachUid: 'c-old', status: 'accepted', updatedAt: {seconds: 100}},
        {coachUid: 'c-new', status: 'accepted', updatedAt: {seconds: 200}},
      ]);
      expect(firestoreMock.__getStore().get('users/a1').coachId).toBe(
        'c-new',
      );
    });
  });
});
