import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';
import {deleteAccount} from '../userService';

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

describe('deleteAccount', () => {
  it('throws when not signed in', async () => {
    await expect(deleteAccount()).rejects.toThrow('Not signed in');
  });

  it('deletes every doc in skis / waxLogs / testLogs subcollections', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});
    firestoreMock.__seedDoc('users/a1/skis/s1', {name: 'A'});
    firestoreMock.__seedDoc('users/a1/skis/s2', {name: 'B'});
    firestoreMock.__seedDoc('users/a1/waxLogs/w1', {skiId: 's1'});
    firestoreMock.__seedDoc('users/a1/testLogs/t1', {skiId: 's1'});

    await deleteAccount();

    const store = firestoreMock.__getStore();
    expect(store.has('users/a1')).toBe(false);
    expect(store.has('users/a1/skis/s1')).toBe(false);
    expect(store.has('users/a1/skis/s2')).toBe(false);
    expect(store.has('users/a1/waxLogs/w1')).toBe(false);
    expect(store.has('users/a1/testLogs/t1')).toBe(false);
  });

  it('deletes the parent user doc', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com'});
    await deleteAccount();
    expect(firestoreMock.__getStore().has('users/a1')).toBe(false);
  });

  it('calls user.delete() on the auth user', async () => {
    const u = {
      uid: 'a1',
      email: 'a@b.com',
      delete: jest.fn(() => Promise.resolve()),
    };
    authMock.__setCurrentUser(u);
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com'});
    await deleteAccount();
    expect(u.delete).toHaveBeenCalledTimes(1);
  });

  it('if the user is a coach, clears coachId on every dependent athlete', async () => {
    authMock.__setCurrentUser({uid: 'c1', email: 'coach@b.com'});
    firestoreMock.__seedDoc('users/c1', {role: 'coach', email: 'coach@b.com'});
    firestoreMock.__seedDoc('users/ath1', {
      email: 'ath1@b.com',
      role: 'athlete',
      coachId: 'c1',
    });
    firestoreMock.__seedDoc('users/ath2', {
      email: 'ath2@b.com',
      role: 'athlete',
      coachId: 'c1',
    });
    // An unrelated athlete with a different coach — must NOT be touched.
    firestoreMock.__seedDoc('users/ath3', {
      email: 'ath3@b.com',
      role: 'athlete',
      coachId: 'someone-else',
    });

    await deleteAccount();

    const store = firestoreMock.__getStore();
    expect(store.has('users/c1')).toBe(false);
    expect(store.get('users/ath1').coachId).toBeNull();
    expect(store.get('users/ath2').coachId).toBeNull();
    expect(store.get('users/ath3').coachId).toBe('someone-else');
  });

  it('runs unlink BEFORE the auth user is deleted (verified via call order)', async () => {
    const order = [];
    const u = {
      uid: 'c1',
      delete: jest.fn(() => {
        order.push('auth.delete');
        return Promise.resolve();
      }),
    };
    authMock.__setCurrentUser(u);
    firestoreMock.__seedDoc('users/c1', {role: 'coach'});
    firestoreMock.__seedDoc('users/ath1', {role: 'athlete', coachId: 'c1'});

    // Spy on store mutations.
    const origDelete = firestoreMock.__getStore().delete.bind(
      firestoreMock.__getStore(),
    );
    firestoreMock.__getStore().delete = path => {
      if (path === 'users/c1') {
        order.push('user-doc.delete');
      }
      return origDelete(path);
    };

    await deleteAccount();

    expect(order.indexOf('user-doc.delete')).toBeLessThan(
      order.indexOf('auth.delete'),
    );
  });
});
