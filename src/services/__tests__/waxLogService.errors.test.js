import firestoreMock from '@react-native-firebase/firestore';
import {createWaxLog, listWaxLogsForSki} from '../waxLogService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('waxLogService error paths', () => {
  it('createWaxLog rejects when add fails', async () => {
    const err = new Error('network');
    err.code = 'unavailable';
    firestoreMock.__injectError(err);
    await expect(
      createWaxLog('u1', {skiId: 'ski1', notes: 'x'}),
    ).rejects.toThrow('network');
  });

  it('listWaxLogsForSki rejects on permission error', async () => {
    const err = new Error('permission denied');
    firestoreMock.__injectError(err);
    await expect(listWaxLogsForSki('u1', 'ski1')).rejects.toThrow(
      'permission denied',
    );
  });
});
