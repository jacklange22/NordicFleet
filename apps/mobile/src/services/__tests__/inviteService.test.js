import firestoreMock from '@react-native-firebase/firestore';
import {
  createInvites,
  subscribeInvitesForCoach,
  revokeInvite,
} from '../inviteService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('inviteService', () => {
  describe('createInvites', () => {
    it('rejects a missing coachUid', async () => {
      await expect(createInvites()).rejects.toThrow(/coachUid/);
    });

    it('creates one pending invite per valid email, lowercased, with a token', async () => {
      const created = await createInvites('coach', 'Coach Pat', [
        'A@x.com',
        'b@x.com',
      ]);
      expect(created.length).toBe(2);
      const stored = [...firestoreMock.__getStore().entries()].filter(([k]) =>
        k.startsWith('athleteInvites/'),
      );
      expect(stored.length).toBe(2);
      for (const [, doc] of stored) {
        expect(doc.coachUid).toBe('coach');
        expect(doc.status).toBe('pending');
        expect(typeof doc.token).toBe('string');
        expect(doc.email).toMatch(/^[a-z@.x]+$/); // lowercased
        expect(doc.expiresAt).toBeDefined();
      }
    });

    it('skips invalid emails rather than aborting the batch', async () => {
      const created = await createInvites('coach', 'Coach', [
        'ok@x.com',
        'not-an-email',
      ]);
      expect(created.length).toBe(1);
      expect(created[0].email).toBe('ok@x.com');
    });
  });

  describe('subscribeInvitesForCoach', () => {
    it('fires with [] for a missing coachUid', () => {
      const cb = jest.fn();
      subscribeInvitesForCoach(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('delivers only the coach own invites', () => {
      firestoreMock.__seedDoc('athleteInvites/i1', {
        coachUid: 'coach',
        email: 'a@x.com',
        status: 'pending',
        createdAt: {seconds: 100},
      });
      firestoreMock.__seedDoc('athleteInvites/i2', {
        coachUid: 'other',
        email: 'b@x.com',
        status: 'pending',
        createdAt: {seconds: 200},
      });
      const cb = jest.fn();
      subscribeInvitesForCoach('coach', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.length).toBe(1);
      expect(last[0].id).toBe('i1');
    });
  });

  describe('revokeInvite', () => {
    it('throws without an id', async () => {
      await expect(revokeInvite()).rejects.toThrow(/inviteId/);
    });

    it('sets status to revoked', async () => {
      firestoreMock.__seedDoc('athleteInvites/i1', {
        coachUid: 'coach',
        email: 'a@x.com',
        status: 'pending',
      });
      await revokeInvite('i1');
      expect(firestoreMock.__getStore().get('athleteInvites/i1').status).toBe(
        'revoked',
      );
    });
  });
});
