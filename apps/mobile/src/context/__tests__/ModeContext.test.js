import React from 'react';
import {Text, Pressable} from 'react-native';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Drive the profile + user through mocks so we can flip isCoach.
let mockUser = {uid: 'u1'};
let mockProfile = {uid: 'u1', isCoach: true};
// When true, the profile subscription does NOT fire synchronously; the test
// captures the callback (mockProfileCb) and delivers the profile by hand —
// reproducing the real-device race where AsyncStorage restores the mode
// before the Firestore profile (and isCoach) arrives.
let mockDeferProfile = false;
let mockProfileCb = null;

jest.mock('../AuthContext', () => ({
  useAuth: () => ({user: mockUser}),
}));

jest.mock('../../services/userService', () => ({
  subscribeProfile: (uid, cb) => {
    if (mockDeferProfile) {
      mockProfileCb = cb;
    } else {
      cb(mockProfile);
    }
    return () => {};
  },
  backfillCoachCapability: jest.fn(() => Promise.resolve(true)),
}));

const {ModeProvider, useMode} = require('../ModeContext');

const STORAGE_KEY = 'nordicfleet.mode';

// Tiny probe component that surfaces the context + a toggle button.
function Probe() {
  const {mode, setMode, isCoach} = useMode();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="isCoach">{String(isCoach)}</Text>
      <Pressable testID="go-coaching" onPress={() => setMode('coaching')}>
        <Text>coaching</Text>
      </Pressable>
      <Pressable testID="go-personal" onPress={() => setMode('personal')}>
        <Text>personal</Text>
      </Pressable>
      <Pressable testID="go-waxtruck" onPress={() => setMode('waxtruck')}>
        <Text>waxtruck</Text>
      </Pressable>
    </>
  );
}

const renderProbe = () =>
  render(
    <ModeProvider>
      <Probe />
    </ModeProvider>,
  );

beforeEach(async () => {
  mockUser = {uid: 'u1'};
  mockProfile = {uid: 'u1', isCoach: true};
  mockDeferProfile = false;
  mockProfileCb = null;
  if (AsyncStorage.__reset) {
    AsyncStorage.__reset();
  }
});

describe('ModeContext', () => {
  it('defaults to personal mode', async () => {
    const tree = renderProbe();
    await act(async () => {});
    expect(tree.getByTestId('mode').props.children).toBe('personal');
  });

  it('a coach can toggle to coaching mode and it persists', async () => {
    const tree = renderProbe();
    await act(async () => {});
    expect(tree.getByTestId('isCoach').props.children).toBe('true');

    await act(async () => {
      fireEvent.press(tree.getByTestId('go-coaching'));
    });
    expect(tree.getByTestId('mode').props.children).toBe('coaching');

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      expect(stored).toBe('coaching');
    });
  });

  it('restores the persisted mode on mount', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'coaching');
    const tree = renderProbe();
    await waitFor(() => {
      expect(tree.getByTestId('mode').props.children).toBe('coaching');
    });
  });

  it('a coach can toggle to wax-truck mode and it persists', async () => {
    const tree = renderProbe();
    await act(async () => {});

    await act(async () => {
      fireEvent.press(tree.getByTestId('go-waxtruck'));
    });
    expect(tree.getByTestId('mode').props.children).toBe('waxtruck');

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      expect(stored).toBe('waxtruck');
    });
  });

  it('restores a persisted wax-truck mode on mount', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'waxtruck');
    const tree = renderProbe();
    await waitFor(() => {
      expect(tree.getByTestId('mode').props.children).toBe('waxtruck');
    });
  });

  it('non-coaches are locked to personal — setMode is a no-op', async () => {
    mockProfile = {uid: 'u1', isCoach: false};
    const tree = renderProbe();
    await act(async () => {});
    expect(tree.getByTestId('isCoach').props.children).toBe('false');

    await act(async () => {
      fireEvent.press(tree.getByTestId('go-coaching'));
    });
    // Still personal — the toggle did nothing.
    expect(tree.getByTestId('mode').props.children).toBe('personal');
  });

  it('a non-coach with a stale coaching mode gets snapped back to personal', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'coaching');
    mockProfile = {uid: 'u1', isCoach: false};
    const tree = renderProbe();
    await waitFor(() => {
      expect(tree.getByTestId('mode').props.children).toBe('personal');
    });
  });

  it('a non-coach with a stale waxtruck mode gets snapped back to personal', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'waxtruck');
    mockProfile = {uid: 'u1', isCoach: false};
    const tree = renderProbe();
    await waitFor(() => {
      expect(tree.getByTestId('mode').props.children).toBe('personal');
    });
  });

  it('a corrupt stored mode resets to personal and clears storage', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, 'not-a-real-mode');
    mockProfile = {uid: 'u1', isCoach: true};
    const tree = renderProbe();
    await act(async () => {});
    await act(async () => {});
    // Invalid value never applied — stays personal.
    expect(tree.getByTestId('mode').props.children).toBe('personal');
    // And the garbage value is cleared from storage.
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('a coach with a stored waxtruck mode keeps it after async profile load', async () => {
    mockDeferProfile = true;
    await AsyncStorage.setItem(STORAGE_KEY, 'waxtruck');
    const tree = renderProbe();
    await act(async () => {});
    await act(async () => {});
    await act(async () => {});
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('waxtruck');
    await act(async () => {
      mockProfileCb({uid: 'u1', isCoach: true});
    });
    expect(tree.getByTestId('mode').props.children).toBe('waxtruck');
  });

  it('keeps a coach in their persisted mode while the profile is still loading', async () => {
    // Reproduce the cold-start race: the persisted mode restores from
    // AsyncStorage before the (deferred) Firestore profile resolves, so
    // isCoach is still false at restore time. The persisted mode must NOT be
    // overwritten — otherwise a coach gets clobbered to personal every launch.
    mockDeferProfile = true;
    await AsyncStorage.setItem(STORAGE_KEY, 'coaching');
    const tree = renderProbe();

    // Flush mount effects: deferred profile-subscribe, AsyncStorage restore,
    // and the snap-back effect. The buggy version writes 'personal' here.
    await act(async () => {});
    await act(async () => {});
    await act(async () => {});
    // Profile hasn't arrived, so the UI safely shows personal — but the
    // persisted value is intact, not clobbered.
    expect(tree.getByTestId('isCoach').props.children).toBe('false');
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('coaching');

    // Now the coach profile arrives → coaching mode surfaces.
    await act(async () => {
      mockProfileCb({uid: 'u1', isCoach: true});
    });
    expect(tree.getByTestId('mode').props.children).toBe('coaching');
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBe('coaching');
  });

  it('derives isCoach from a legacy role-only profile', async () => {
    mockProfile = {uid: 'u1', role: 'coach'};
    const tree = renderProbe();
    await act(async () => {});
    expect(tree.getByTestId('isCoach').props.children).toBe('true');
  });
});
