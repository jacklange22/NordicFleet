import firestoreMock from '@react-native-firebase/firestore';
import {
  getProfile,
  createProfile,
  updateProfile,
  subscribeProfile,
} from '../userService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('userService', () => {
  describe('getProfile', () => {
    it('returns null for missing uid', async () => {
      expect(await getProfile()).toBeNull();
      expect(await getProfile('')).toBeNull();
    });

    it('returns null when profile does not exist', async () => {
      const profile = await getProfile('ghost');
      expect(profile).toBeNull();
    });

    it('returns the profile with uid', async () => {
      firestoreMock.__seedDoc('users/u1', {email: 'a@b.com'});
      const profile = await getProfile('u1');
      expect(profile).toEqual({uid: 'u1', email: 'a@b.com'});
    });
  });

  describe('createProfile', () => {
    it('throws when uid is missing', async () => {
      await expect(createProfile()).rejects.toThrow('uid is required');
    });

    it('writes the seed fields', async () => {
      await createProfile('u1', {email: 'a@b.com', displayName: 'Anna'});
      const profile = await getProfile('u1');
      expect(profile.email).toBe('a@b.com');
      expect(profile.displayName).toBe('Anna');
      expect(profile.team).toBeNull();
      expect(profile.createdAt).toBeDefined();
    });

    it('is safe to call twice (merge semantics)', async () => {
      await createProfile('u1', {email: 'a@b.com'});
      await createProfile('u1', {displayName: 'Anna'});
      const profile = await getProfile('u1');
      expect(profile.email).toBe('a@b.com');
      expect(profile.displayName).toBe('Anna');
    });
  });

  describe('updateProfile', () => {
    it('merges with existing data', async () => {
      await createProfile('u1', {email: 'a@b.com'});
      await updateProfile('u1', {weight: 70});
      const profile = await getProfile('u1');
      expect(profile.email).toBe('a@b.com');
      expect(profile.weight).toBe(70);
    });

    it('throws when uid is missing', async () => {
      await expect(updateProfile(undefined, {weight: 70})).rejects.toThrow(
        'uid is required',
      );
    });
  });

  describe('subscribeProfile', () => {
    it('fires with profile data and returns an unsubscribe function', () => {
      firestoreMock.__seedDoc('users/u1', {email: 'a@b.com'});
      const cb = jest.fn();
      const unsub = subscribeProfile('u1', cb);
      expect(typeof unsub).toBe('function');
      expect(cb).toHaveBeenCalledWith({uid: 'u1', email: 'a@b.com'});
      unsub();
    });

    it('fires with null when missing', () => {
      const cb = jest.fn();
      const unsub = subscribeProfile('ghost', cb);
      expect(cb).toHaveBeenCalledWith(null);
      unsub();
    });

    it('handles missing uid without crashing', () => {
      const cb = jest.fn();
      const unsub = subscribeProfile(null, cb);
      expect(cb).toHaveBeenCalledWith(null);
      expect(typeof unsub).toBe('function');
    });
  });
});
