import firestoreMock from '@react-native-firebase/firestore';
import {
  sendMessage,
  sendAdvisory,
  markRead,
  subscribeMessagesForAthlete,
  subscribeMessagesForUser,
  subscribeMessagesFromCoach,
  subscribeUnreadCountForAthlete,
  getMessage,
} from '../messageService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('messageService', () => {
  describe('sendMessage', () => {
    it('rejects when fromUid is missing', async () => {
      await expect(
        sendMessage({fromUid: '', toUid: 'a', body: 'hi'}),
      ).rejects.toThrow();
    });

    it('rejects empty body', async () => {
      await expect(
        sendMessage({fromUid: 'c', toUid: 'a', body: '   '}),
      ).rejects.toThrow(/body is required/);
    });

    it('persists a message doc with the expected shape', async () => {
      const id = await sendMessage({
        fromUid: 'c1',
        toUid: 'a1',
        body: 'Try the new wax tonight',
        subject: 'Wax tip',
        attachedSkiIds: ['ski-a', 'ski-b'],
      });
      const stored = firestoreMock.__getStore().get(`messages/${id}`);
      expect(stored).toMatchObject({
        fromUid: 'c1',
        toUid: 'a1',
        body: 'Try the new wax tonight',
        subject: 'Wax tip',
        attachedSkiIds: ['ski-a', 'ski-b'],
        read: false,
      });
      expect(stored.createdAt).toBeDefined();
    });
  });

  describe('sendAdvisory', () => {
    it('persists an advisory doc with type=advisory and structured payload', async () => {
      const id = await sendAdvisory({
        fromUid: 'c1',
        toUid: 'a1',
        event: 'Birken 2026',
        eventDate: '2026-03-15',
        conditions: {
          snowType: 'cold',
          snowTemperature: -8,
          airTemperature: -10,
          newSnow: false,
          notes: 'Groomed last night.',
        },
        skiRecommendations: [
          {skiId: 'ski-a', role: 'primary', notes: 'Pure cold conditions'},
          {skiId: 'ski-b', role: 'backup', notes: 'If it warms to -3'},
        ],
      });
      const stored = firestoreMock.__getStore().get(`messages/${id}`);
      expect(stored).toMatchObject({
        fromUid: 'c1',
        toUid: 'a1',
        type: 'advisory',
        read: false,
        attachedSkiIds: ['ski-a', 'ski-b'],
        advisory: {
          event: 'Birken 2026',
          eventDate: '2026-03-15',
          conditions: {
            snowType: 'cold',
            snowTemperature: -8,
            airTemperature: -10,
            newSnow: false,
            notes: 'Groomed last night.',
          },
          skiRecommendations: [
            {skiId: 'ski-a', role: 'primary', notes: 'Pure cold conditions'},
            {skiId: 'ski-b', role: 'backup', notes: 'If it warms to -3'},
          ],
        },
      });
      // Subject auto-falls-back to "Race plan: {event}" when not given.
      expect(stored.subject).toBe('Race plan: Birken 2026');
      expect(stored.createdAt).toBeDefined();
    });

    it('rejects when there is no primary ski', async () => {
      await expect(
        sendAdvisory({
          fromUid: 'c1',
          toUid: 'a1',
          event: 'Birken 2026',
          eventDate: '2026-03-15',
          skiRecommendations: [{skiId: 'ski-a', role: 'backup'}],
        }),
      ).rejects.toThrow(/primary/);
    });

    it('rejects malformed dates', async () => {
      await expect(
        sendAdvisory({
          fromUid: 'c1',
          toUid: 'a1',
          event: 'Birken 2026',
          eventDate: 'next sunday',
          skiRecommendations: [{skiId: 'ski-a', role: 'primary'}],
        }),
      ).rejects.toThrow(/YYYY-MM-DD/);
    });
  });

  describe('markRead', () => {
    it('flips read to true', async () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'c1',
        toUid: 'a1',
        body: 'hi',
        read: false,
      });
      await markRead('m1');
      expect(firestoreMock.__getStore().get('messages/m1').read).toBe(true);
    });

    it('throws when messageId is empty', async () => {
      await expect(markRead()).rejects.toThrow();
    });
  });

  describe('subscribeMessagesForAthlete', () => {
    it('fires with [] for missing uid', () => {
      const cb = jest.fn();
      subscribeMessagesForAthlete(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('delivers messages addressed to the athlete', () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'c1',
        toUid: 'a1',
        body: 'A',
        read: false,
        createdAt: {seconds: 100},
      });
      firestoreMock.__seedDoc('messages/m2', {
        fromUid: 'c1',
        toUid: 'someone-else',
        body: 'B',
        read: false,
        createdAt: {seconds: 200},
      });
      const cb = jest.fn();
      subscribeMessagesForAthlete('a1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.length).toBe(1);
      expect(last[0].body).toBe('A');
    });
  });

  describe('subscribeMessagesForUser', () => {
    it('fires with [] for missing uid', () => {
      const cb = jest.fn();
      subscribeMessagesForUser(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('tags a message the coach sent as direction=sent', () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'coach',
        toUid: 'a1',
        body: 'Try the cold wax',
        read: false,
        createdAt: {seconds: 100},
      });
      const cb = jest.fn();
      subscribeMessagesForUser('coach', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.length).toBe(1);
      expect(last[0].id).toBe('m1');
      expect(last[0].direction).toBe('sent');
    });

    it('tags the same message the athlete received as direction=received', () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'coach',
        toUid: 'a1',
        body: 'Try the cold wax',
        read: false,
        createdAt: {seconds: 100},
      });
      const cb = jest.fn();
      subscribeMessagesForUser('a1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.length).toBe(1);
      expect(last[0].id).toBe('m1');
      expect(last[0].direction).toBe('received');
    });

    it('merges sent and received into one list, newest first, no duplicates', () => {
      // Athlete a1 received this one (oldest).
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'coach',
        toUid: 'a1',
        body: 'received-old',
        read: false,
        createdAt: {seconds: 100},
      });
      // a1 sent this one to the coach (newest).
      firestoreMock.__seedDoc('messages/m2', {
        fromUid: 'a1',
        toUid: 'coach',
        body: 'sent-new',
        read: false,
        createdAt: {seconds: 300},
      });
      // a1 received this one (middle).
      firestoreMock.__seedDoc('messages/m3', {
        fromUid: 'coach',
        toUid: 'a1',
        body: 'received-mid',
        read: true,
        createdAt: {seconds: 200},
      });
      // Not involving a1 at all - must be excluded.
      firestoreMock.__seedDoc('messages/m4', {
        fromUid: 'coach',
        toUid: 'someone-else',
        body: 'unrelated',
        read: false,
        createdAt: {seconds: 400},
      });
      const cb = jest.fn();
      subscribeMessagesForUser('a1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.map(m => m.id)).toEqual(['m2', 'm3', 'm1']);
      expect(last.map(m => m.direction)).toEqual([
        'sent',
        'received',
        'received',
      ]);
      expect(last.some(m => m.body === 'unrelated')).toBe(false);
    });
  });

  describe('subscribeMessagesFromCoach', () => {
    it('returns only the messages between this coach and athlete', () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'c1',
        toUid: 'a1',
        body: 'A',
        createdAt: {seconds: 100},
      });
      firestoreMock.__seedDoc('messages/m2', {
        fromUid: 'c2',
        toUid: 'a1',
        body: 'B',
        createdAt: {seconds: 200},
      });
      const cb = jest.fn();
      subscribeMessagesFromCoach('c1', 'a1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.length).toBe(1);
      expect(last[0].body).toBe('A');
    });
  });

  describe('subscribeUnreadCountForAthlete', () => {
    it('counts unread messages', () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'c1',
        toUid: 'a1',
        read: false,
      });
      firestoreMock.__seedDoc('messages/m2', {
        fromUid: 'c1',
        toUid: 'a1',
        read: false,
      });
      firestoreMock.__seedDoc('messages/m3', {
        fromUid: 'c1',
        toUid: 'a1',
        read: true,
      });
      const cb = jest.fn();
      subscribeUnreadCountForAthlete('a1', cb);
      expect(cb).toHaveBeenLastCalledWith(2);
    });
  });

  describe('getMessage', () => {
    it('returns null when missing', async () => {
      expect(await getMessage('ghost')).toBeNull();
    });
    it('returns the doc when present', async () => {
      firestoreMock.__seedDoc('messages/m1', {
        fromUid: 'c1',
        toUid: 'a1',
        body: 'hi',
      });
      const msg = await getMessage('m1');
      expect(msg.id).toBe('m1');
      expect(msg.body).toBe('hi');
    });
  });
});
