import firestoreMock from '@react-native-firebase/firestore';
import {
  listTestLogsForSki,
  listAllTestLogs,
  createTestLog,
  subscribeTestLogsForSki,
  subscribeAllTestLogs,
} from '../testLogService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('testLogService', () => {
  describe('listTestLogsForSki', () => {
    it('returns [] when uid or skiId is missing', async () => {
      expect(await listTestLogsForSki()).toEqual([]);
      expect(await listTestLogsForSki('u1')).toEqual([]);
    });

    it('filters by skiId and returns newest first', async () => {
      firestoreMock.__seedDoc('users/u1/testLogs/log1', {
        skiId: 'ski1',
        date: 100,
      });
      firestoreMock.__seedDoc('users/u1/testLogs/log2', {
        skiId: 'ski1',
        date: 200,
      });
      firestoreMock.__seedDoc('users/u1/testLogs/log3', {
        skiId: 'ski2',
        date: 150,
      });
      const logs = await listTestLogsForSki('u1', 'ski1');
      expect(logs.length).toBe(2);
      expect(logs[0].date).toBe(200);
    });
  });

  describe('listAllTestLogs', () => {
    it('returns [] for missing uid', async () => {
      expect(await listAllTestLogs()).toEqual([]);
    });

    it('orders by date desc', async () => {
      firestoreMock.__seedDoc('users/u1/testLogs/a', {date: 1});
      firestoreMock.__seedDoc('users/u1/testLogs/b', {date: 2});
      const logs = await listAllTestLogs('u1');
      expect(logs[0].id).toBe('b');
    });
  });

  describe('createTestLog', () => {
    it('throws without uid', async () => {
      await expect(createTestLog()).rejects.toThrow('uid is required');
    });

    it('throws without skiId', async () => {
      await expect(createTestLog('u1', {})).rejects.toThrow(
        'skiId is required',
      );
    });

    it('coerces numeric fields and lowercases enums', async () => {
      const id = await createTestLog('u1', {
        skiId: 'ski1',
        temperature: '-2',
        humidity: '55',
        snowType: 'Old',
        surface: 'Hardpack',
        glideRating: '8',
        kickRating: '7',
        stabilityRating: '6',
        climbingRating: '5',
        notes: '',
      });
      expect(typeof id).toBe('string');
      const logs = await listTestLogsForSki('u1', 'ski1');
      expect(logs[0].temperature).toBe(-2);
      expect(logs[0].humidity).toBe(55);
      expect(logs[0].snowType).toBe('old');
      expect(logs[0].surface).toBe('hardpack');
      expect(logs[0].glideRating).toBe(8);
      expect(logs[0].kickRating).toBe(7);
    });

    it('handles missing numeric inputs as null/0', async () => {
      const id = await createTestLog('u1', {skiId: 'ski1'});
      const logs = await listTestLogsForSki('u1', 'ski1');
      expect(logs[0].temperature).toBeNull();
      expect(logs[0].humidity).toBeNull();
      expect(logs[0].kickRating).toBeNull();
      expect(typeof id).toBe('string');
    });
  });

  describe('subscribeTestLogsForSki', () => {
    it('returns an unsubscribe function', () => {
      const unsub = subscribeTestLogsForSki('u1', 's1', () => {});
      expect(typeof unsub).toBe('function');
    });

    it('handles missing args by firing with []', () => {
      const cb = jest.fn();
      subscribeTestLogsForSki(null, null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });
  });

  describe('subscribeAllTestLogs', () => {
    it('fires with [] for missing uid', () => {
      const cb = jest.fn();
      subscribeAllTestLogs(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('delivers every test log across skis, newest first', () => {
      firestoreMock.__seedDoc('users/u1/testLogs/a', {skiId: 's1', date: 10});
      firestoreMock.__seedDoc('users/u1/testLogs/b', {skiId: 's2', date: 30});
      firestoreMock.__seedDoc('users/u1/testLogs/c', {skiId: 's1', date: 20});
      const cb = jest.fn();
      subscribeAllTestLogs('u1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.map(l => l.id)).toEqual(['b', 'c', 'a']);
    });

    it('re-fires when a new log is added', () => {
      firestoreMock.__seedDoc('users/u1/testLogs/a', {skiId: 's1', date: 10});
      const cb = jest.fn();
      subscribeAllTestLogs('u1', cb);
      expect(cb.mock.calls[cb.mock.calls.length - 1][0].length).toBe(1);
      firestoreMock.__seedDoc('users/u1/testLogs/b', {skiId: 's2', date: 30});
      expect(cb.mock.calls[cb.mock.calls.length - 1][0].length).toBe(2);
    });
  });
});
