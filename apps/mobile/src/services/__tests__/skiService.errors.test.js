import firestoreMock from '@react-native-firebase/firestore';
import {createSki, updateSki, hardDeleteSki, getSki} from '../skiService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('skiService error paths', () => {
  it('createSki rejects when add fails', async () => {
    const err = new Error('quota');
    err.code = 'resource-exhausted';
    firestoreMock.__injectError(err);
    // Pass a fully-valid input so validation lets the call through
    // to Firestore, where the injected error fires.
    await expect(
      createSki('u1', {name: 'X', technique: 'classic', type: 'cold'}),
    ).rejects.toThrow('quota');
  });

  it('updateSki rejects when set fails', async () => {
    const err = new Error('permission denied');
    firestoreMock.__injectError(err);
    await expect(updateSki('u1', 'abc', {flex: 95})).rejects.toThrow(
      'permission denied',
    );
  });

  it('hardDeleteSki throws when uid or skiId is missing', async () => {
    await expect(hardDeleteSki()).rejects.toThrow();
    await expect(hardDeleteSki('u1')).rejects.toThrow();
  });

  it('getSki rejects when underlying get fails', async () => {
    const err = new Error('boom');
    firestoreMock.__injectError(err);
    await expect(getSki('u1', 'abc')).rejects.toThrow('boom');
  });
});
