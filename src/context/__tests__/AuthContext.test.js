import React from 'react';
import {Text} from 'react-native';
import {render, act} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import {AuthProvider, useAuth} from '../AuthContext';

const Probe = ({onState}) => {
  const ctx = useAuth();
  onState(ctx);
  return (
    <Text testID="state">
      {ctx.loading ? 'loading' : ctx.user ? 'in' : 'out'}
    </Text>
  );
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

describe('AuthContext', () => {
  it('starts loading then resolves to signed-out', () => {
    let latest;
    const tree = render(
      <AuthProvider>
        <Probe onState={s => (latest = s)} />
      </AuthProvider>,
    );
    // onAuthStateChanged fires synchronously with current user (null).
    expect(latest.loading).toBe(false);
    expect(latest.user).toBeNull();
    expect(tree.getByTestId('state').props.children).toBe('out');
  });

  it('signUp creates a profile doc', async () => {
    let latest;
    render(
      <AuthProvider>
        <Probe onState={s => (latest = s)} />
      </AuthProvider>,
    );
    await act(async () => {
      await latest.signUp('a@b.com', 'password1');
    });
    expect(latest.user).not.toBeNull();
    expect(latest.user.email).toBe('a@b.com');
    const profileDoc = firestoreMock
      .__getStore()
      .get(`users/${latest.user.uid}`);
    expect(profileDoc).toBeDefined();
    expect(profileDoc.email).toBe('a@b.com');
  });

  it('signIn flips user to signed-in', async () => {
    authMock.__seedUser('a@b.com', 'pw', 'uid_seed');
    let latest;
    render(
      <AuthProvider>
        <Probe onState={s => (latest = s)} />
      </AuthProvider>,
    );
    await act(async () => {
      await latest.signIn('a@b.com', 'pw');
    });
    expect(latest.user.uid).toBe('uid_seed');
  });

  it('signIn rejects with friendly error code on bad creds', async () => {
    let latest;
    render(
      <AuthProvider>
        <Probe onState={s => (latest = s)} />
      </AuthProvider>,
    );
    let err;
    await act(async () => {
      try {
        await latest.signIn('nope@b.com', 'wrong');
      } catch (e) {
        err = e;
      }
    });
    expect(err).toBeDefined();
    expect(err.code).toBe('auth/invalid-credential');
  });

  it('signUp still resolves if profile write fails (offline-tolerant)', async () => {
    // Force getCurrentUser collection writes to error by overriding the mock
    // for this test. The simplest pin is to mock createProfile to throw.
    jest.resetModules();
    jest.doMock('../../services/userService', () => ({
      createProfile: jest.fn().mockRejectedValue(new Error('offline')),
      getProfile: jest.fn(),
    }));
    const {AuthProvider: Provider} = require('../AuthContext');
    let latest;
    render(
      <Provider>
        <Probe onState={s => (latest = s)} />
      </Provider>,
    );
    await act(async () => {
      await latest.signUp('offline@b.com', 'password1');
    });
    // User is still created; profile write was swallowed.
    expect(latest.user).not.toBeNull();
  });

  it('signOut clears user', async () => {
    authMock.__seedUser('a@b.com', 'pw');
    let latest;
    render(
      <AuthProvider>
        <Probe onState={s => (latest = s)} />
      </AuthProvider>,
    );
    await act(async () => {
      await latest.signIn('a@b.com', 'pw');
    });
    expect(latest.user).not.toBeNull();
    await act(async () => {
      await latest.signOut();
    });
    expect(latest.user).toBeNull();
  });
});
