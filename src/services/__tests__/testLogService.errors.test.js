import firestoreMock from '@react-native-firebase/firestore';
import {createTestLog, listTestLogsForSki} from '../testLogService';

beforeEach(() => {
  firestoreMock.__resetFirestoreMock();
});

describe('testLogService error paths', () => {
  it('createTestLog rejects when add fails', async () => {
    const err = new Error('network');
    err.code = 'unavailable';
    firestoreMock.__injectError(err);
    await expect(
      createTestLog('u1', {skiId: 'ski1', notes: 'x'}),
    ).rejects.toThrow('network');
  });

  it('listTestLogsForSki rejects on permission error', async () => {
    const err = new Error('permission denied');
    firestoreMock.__injectError(err);
    await expect(listTestLogsForSki('u1', 'ski1')).rejects.toThrow(
      'permission denied',
    );
  });
});
