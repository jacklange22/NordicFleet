import firestoreMock from '@react-native-firebase/firestore';
import {
  listWaxLogsForSki,
  listAllWaxLogs,
  createWaxLog,
  subscribeWaxLogsForSki,
} from '../waxLogService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('waxLogService', () => {
  describe('listWaxLogsForSki', () => {
    it('returns [] when uid or skiId is missing', async () => {
      expect(await listWaxLogsForSki()).toEqual([]);
      expect(await listWaxLogsForSki('u1')).toEqual([]);
    });

    it('filters by skiId and returns newest first', async () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/log1', {
        skiId: 'ski1',
        date: 100,
      });
      firestoreMock.__seedDoc('users/u1/waxLogs/log2', {
        skiId: 'ski1',
        date: 200,
      });
      firestoreMock.__seedDoc('users/u1/waxLogs/log3', {
        skiId: 'ski2',
        date: 150,
      });
      const logs = await listWaxLogsForSki('u1', 'ski1');
      expect(logs.length).toBe(2);
      expect(logs[0].date).toBe(200); // newest first
      expect(logs[1].date).toBe(100);
    });
  });

  describe('listAllWaxLogs', () => {
    it('returns all logs across skis newest first', async () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/a', {skiId: 's1', date: 50});
      firestoreMock.__seedDoc('users/u1/waxLogs/b', {skiId: 's2', date: 70});
      const logs = await listAllWaxLogs('u1');
      expect(logs.length).toBe(2);
      expect(logs[0].id).toBe('b');
    });

    it('returns [] for missing uid', async () => {
      expect(await listAllWaxLogs()).toEqual([]);
    });
  });

  describe('createWaxLog', () => {
    it('throws without uid', async () => {
      await expect(createWaxLog()).rejects.toThrow('uid is required');
    });

    it('throws without skiId in data', async () => {
      await expect(createWaxLog('u1', {})).rejects.toThrow('skiId is required');
    });

    it('writes payload with safe defaults', async () => {
      const id = await createWaxLog('u1', {
        skiId: 'ski1',
        kickLayers: '3',
        glideLayers: 2,
        glideWaxes: ['CH8', 'HF10'],
        notes: 'Cold day',
      });
      expect(typeof id).toBe('string');
      const logs = await listWaxLogsForSki('u1', 'ski1');
      expect(logs.length).toBe(1);
      expect(logs[0].kickLayers).toBe(3);
      expect(logs[0].glideLayers).toBe(2);
      expect(logs[0].glideWaxes).toEqual(['CH8', 'HF10']);
      expect(logs[0].notes).toBe('Cold day');
    });

    it('handles non-array glideWaxes input safely', async () => {
      const id = await createWaxLog('u1', {skiId: 'ski1', glideWaxes: null});
      const logs = await listWaxLogsForSki('u1', 'ski1');
      expect(logs[0].glideWaxes).toEqual([]);
      expect(typeof id).toBe('string');
    });
  });

  describe('subscribeWaxLogsForSki', () => {
    it('returns an unsubscribe function', () => {
      const unsub = subscribeWaxLogsForSki('u1', 's1', () => {});
      expect(typeof unsub).toBe('function');
    });

    it('handles missing uid by firing with []', () => {
      const cb = jest.fn();
      subscribeWaxLogsForSki(null, 's1', cb);
      expect(cb).toHaveBeenCalledWith([]);
    });
  });
});
