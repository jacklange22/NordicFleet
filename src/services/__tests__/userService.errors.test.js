import firestoreMock from '@react-native-firebase/firestore';
import {createProfile, getProfile, updateProfile} from '../userService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('userService error paths', () => {
  it('createProfile rejects if Firestore set fails', async () => {
    const err = new Error('offline');
    err.code = 'unavailable';
    firestoreMock.__injectError(err);
    await expect(createProfile('u1', {email: 'a@b.com'})).rejects.toThrow(
      'offline',
    );
  });

  it('updateProfile rejects on permission failure', async () => {
    const err = new Error('permission denied');
    err.code = 'permission-denied';
    firestoreMock.__injectError(err);
    await expect(updateProfile('u1', {weight: 70})).rejects.toThrow(
      'permission denied',
    );
  });

  it('getProfile rethrows underlying errors', async () => {
    const err = new Error('boom');
    firestoreMock.__injectError(err);
    await expect(getProfile('u1')).rejects.toThrow('boom');
  });
});
