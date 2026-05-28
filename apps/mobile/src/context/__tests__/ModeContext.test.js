import React from 'react';
import {Text, Pressable} from 'react-native';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Drive the profile + user through mocks so we can flip isCoach.
let mockUser = {uid: 'u1'};
let mockProfile = {uid: 'u1', isCoach: true};

jest.mock('../AuthContext', () => ({
  useAuth: () => ({user: mockUser}),
}));

jest.mock('../../services/userService', () => ({
  subscribeProfile: (uid, cb) => {
    cb(mockProfile);
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

  it('derives isCoach from a legacy role-only profile', async () => {
    mockProfile = {uid: 'u1', role: 'coach'};
    const tree = renderProbe();
    await act(async () => {});
    expect(tree.getByTestId('isCoach').props.children).toBe('true');
  });
});
