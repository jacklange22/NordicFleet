import firestoreMock from '@react-native-firebase/firestore';
import {
  listSkis,
  getSki,
  createSki,
  updateSki,
  deleteSki,
  hardDeleteSki,
  subscribeSkis,
  subscribeSki,
} from '../skiService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('skiService', () => {
  describe('listSkis', () => {
    it('returns [] when uid is empty', async () => {
      expect(await listSkis()).toEqual([]);
      expect(await listSkis('')).toEqual([]);
    });

    it('returns every ski under the user', async () => {
      firestoreMock.__seedDoc('users/u1/skis/a', {name: 'A'});
      firestoreMock.__seedDoc('users/u1/skis/b', {name: 'B', retired: true});
      const skis = await listSkis('u1');
      expect(skis.length).toBe(2);
      expect(skis.find(s => s.id === 'a').name).toBe('A');
      expect(skis.find(s => s.id === 'b').retired).toBe(true);
    });
  });

  describe('getSki', () => {
    it('returns null when missing', async () => {
      expect(await getSki('u1', 'ghost')).toBeNull();
    });

    it('returns null for missing uid or skiId', async () => {
      expect(await getSki()).toBeNull();
      expect(await getSki('u1')).toBeNull();
    });

    it('returns the ski including id', async () => {
      firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'Speedmax'});
      const ski = await getSki('u1', 'abc');
      expect(ski.id).toBe('abc');
      expect(ski.name).toBe('Speedmax');
    });
  });

  describe('createSki', () => {
    it('throws when uid is missing', async () => {
      await expect(createSki()).rejects.toThrow('uid is required');
    });

    it('writes payload with sensible defaults', async () => {
      const id = await createSki('u1', {
        name: 'New',
        brand: 'Fischer',
        technique: 'CLASSIC',
        type: 'Cold',
        length: '195',
        flex: '90',
      });
      expect(typeof id).toBe('string');
      const ski = await getSki('u1', id);
      expect(ski.name).toBe('New');
      expect(ski.technique).toBe('classic'); // lowercased
      expect(ski.type).toBe('cold');
      expect(ski.length).toBe(195); // coerced to number
      expect(ski.flex).toBe(90);
      expect(ski.retired).toBe(false);
      expect(ski.createdAt).toBeDefined();
    });

    it('handles empty optional fields without coercing to NaN', async () => {
      const id = await createSki('u1', {name: 'X', length: '', flex: ''});
      const ski = await getSki('u1', id);
      expect(ski.length).toBeNull();
      expect(ski.flex).toBeNull();
    });
  });

  describe('updateSki', () => {
    it('throws when uid or skiId is missing', async () => {
      await expect(updateSki()).rejects.toThrow();
      await expect(updateSki('u1')).rejects.toThrow();
    });

    it('merges fields', async () => {
      firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'X', flex: 80});
      await updateSki('u1', 'abc', {flex: 95});
      const ski = await getSki('u1', 'abc');
      expect(ski.name).toBe('X');
      expect(ski.flex).toBe(95);
    });
  });

  describe('deleteSki (soft)', () => {
    it('flips retired=true', async () => {
      firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'X', retired: false});
      await deleteSki('u1', 'abc');
      const ski = await getSki('u1', 'abc');
      expect(ski.retired).toBe(true);
    });
  });

  describe('hardDeleteSki', () => {
    it('removes the doc entirely', async () => {
      firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'X'});
      await hardDeleteSki('u1', 'abc');
      const ski = await getSki('u1', 'abc');
      expect(ski).toBeNull();
    });
  });

  describe('subscribeSkis', () => {
    it('returns an unsubscribe function', () => {
      const unsub = subscribeSkis('u1', () => {});
      expect(typeof unsub).toBe('function');
    });

    it('fires with empty array for missing uid', () => {
      const cb = jest.fn();
      subscribeSkis(null, cb);
      expect(cb).toHaveBeenCalledWith([]);
    });

    it('fires with current ski list', () => {
      firestoreMock.__seedDoc('users/u1/skis/a', {name: 'A'});
      const cb = jest.fn();
      const unsub = subscribeSkis('u1', cb);
      expect(cb).toHaveBeenCalled();
      const lastCallArg = cb.mock.calls[cb.mock.calls.length - 1][0];
      expect(lastCallArg.find(s => s.id === 'a').name).toBe('A');
      unsub();
    });
  });

  describe('subscribeSki', () => {
    it('fires with null when missing', () => {
      const cb = jest.fn();
      const unsub = subscribeSki('u1', 'ghost', cb);
      expect(cb).toHaveBeenCalledWith(null);
      unsub();
    });
  });
});
