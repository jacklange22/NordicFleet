import firestoreMock from '@react-native-firebase/firestore';
import {
  sendMessage,
  markRead,
  subscribeMessagesForAthlete,
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
