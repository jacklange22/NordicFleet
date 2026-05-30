import firestoreMock from '@react-native-firebase/firestore';
import {
  listWaxLogsForSki,
  listAllWaxLogs,
  createWaxLog,
  getWaxLog,
  updateWaxLog,
  subscribeWaxLogsForSki,
  subscribeAllWaxLogs,
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

  describe('getWaxLog', () => {
    it('returns null for missing args or a missing doc', async () => {
      expect(await getWaxLog()).toBeNull();
      expect(await getWaxLog('u1', 'ghost')).toBeNull();
    });

    it('returns the stored log', async () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
        skiId: 's1',
        binder: 'VG Swix',
      });
      const log = await getWaxLog('u1', 'w1');
      expect(log.id).toBe('w1');
      expect(log.binder).toBe('VG Swix');
    });
  });

  describe('updateWaxLog', () => {
    it('throws without uid or logId', async () => {
      await expect(updateWaxLog()).rejects.toThrow('uid is required');
      await expect(updateWaxLog('u1')).rejects.toThrow('logId is required');
    });

    it('edits wax fields, stamps updatedAt, preserves skiId/date/createdAt', async () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
        skiId: 's1',
        date: {seconds: 111},
        createdAt: {seconds: 100},
        binder: 'VG Swix',
        glideWaxes: ['CH8'],
        notes: 'old',
      });
      await updateWaxLog('u1', 'w1', {
        binder: 'Toko Base',
        glideWaxes: ['HF6', 'HF4'],
        glideLayers: 2,
        kickLayers: 2,
        kickWax: 'VR40',
        notes: 'new note',
      });
      const stored = firestoreMock.__getStore().get('users/u1/waxLogs/w1');
      // Edited.
      expect(stored.binder).toBe('Toko Base');
      expect(stored.glideWaxes).toEqual(['HF6', 'HF4']);
      expect(stored.kickLayers).toBe(2);
      expect(stored.notes).toBe('new note');
      // Preserved.
      expect(stored.skiId).toBe('s1');
      expect(stored.date).toEqual({seconds: 111});
      expect(stored.createdAt).toEqual({seconds: 100});
      // Bumped.
      expect(stored.updatedAt).toBeDefined();
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

  describe('subscribeAllWaxLogs', () => {
    it('fires with [] for missing uid', () => {
      const cb = jest.fn();
      subscribeAllWaxLogs(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('delivers every wax log across skis, newest first', () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/a', {skiId: 's1', date: 50});
      firestoreMock.__seedDoc('users/u1/waxLogs/b', {skiId: 's2', date: 90});
      firestoreMock.__seedDoc('users/u1/waxLogs/c', {skiId: 's1', date: 70});
      const cb = jest.fn();
      subscribeAllWaxLogs('u1', cb);
      const last = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(last.map(l => l.id)).toEqual(['b', 'c', 'a']);
    });

    it('re-fires when a new log is added', () => {
      firestoreMock.__seedDoc('users/u1/waxLogs/a', {skiId: 's1', date: 50});
      const cb = jest.fn();
      subscribeAllWaxLogs('u1', cb);
      expect(cb.mock.calls[cb.mock.calls.length - 1][0].length).toBe(1);
      firestoreMock.__seedDoc('users/u1/waxLogs/b', {skiId: 's2', date: 90});
      expect(cb.mock.calls[cb.mock.calls.length - 1][0].length).toBe(2);
    });
  });
});
