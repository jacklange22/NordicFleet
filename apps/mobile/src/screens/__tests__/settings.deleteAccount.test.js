import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Alert} from 'react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SettingsScreen from '../settings';
import {AuthProvider} from '../../context/AuthContext';

// Stub navigation so navigation.reset() is a spy we can assert, instead
// of warning "navigation object hasn't been initialized" when the screen
// resets to Welcome after a successful delete (a bare NavigationContainer
// has no mounted navigator). NavigationContainer stays real for the rest
// of the navigation context. (`mockNav` is read lazily inside
// useNavigation(), so there's no TDZ issue with the hoisted factory.)
const mockNav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => false),
  addListener: jest.fn(() => jest.fn()),
  setOptions: jest.fn(),
};
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {...actual, useNavigation: () => mockNav};
});

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  Object.values(mockNav).forEach(fn => fn.mockClear && fn.mockClear());
});

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderSettings = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <SettingsScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('SettingsScreen — delete account (#4)', () => {
  it('first alert + cancel: does not call deleteAccount', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    let cancelButton;
    Alert.alert = jest.fn((title, msg, buttons) => {
      cancelButton = buttons.find(b => b.text === 'Cancel');
    });

    const tree = renderSettings();
    await waitFor(() => tree.getByLabelText('Delete account'));
    fireEvent.press(tree.getByLabelText('Delete account'));

    expect(Alert.alert).toHaveBeenCalled();
    // Simulate the user tapping Cancel.
    if (cancelButton && cancelButton.onPress) {
      cancelButton.onPress();
    }
    // The reauth modal should NOT be visible.
    expect(tree.queryByLabelText('Confirm delete account')).toBeNull();
    // The user doc still exists.
    expect(firestoreMock.__getStore().has('users/a1')).toBe(true);
  });

  it('first confirm shows a SECOND confirmation, not the password modal', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    const alertCalls = [];
    // Fire only the first alert's destructive button; stop there.
    Alert.alert = jest.fn((title, msg, buttons) => {
      alertCalls.push(title);
      if (alertCalls.length === 1) {
        buttons.find(b => b.style === 'destructive').onPress();
      }
    });

    const tree = renderSettings();
    await waitFor(() => tree.getByLabelText('Delete account'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Delete account'));
    });

    // A second alert was raised…
    expect(Alert.alert).toHaveBeenCalledTimes(2);
    expect(alertCalls[1]).toMatch(/absolutely sure/i);
    // …and the password modal is NOT open yet (need the 2nd confirm).
    expect(tree.queryByLabelText('Password')).toBeNull();
  });

  it('cancel at the second confirmation stops the flow (no modal)', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    let n = 0;
    Alert.alert = jest.fn((title, msg, buttons) => {
      n += 1;
      // Confirm the first, cancel the second.
      const btn =
        n === 1
          ? buttons.find(b => b.style === 'destructive')
          : buttons.find(b => b.style === 'cancel');
      if (btn && btn.onPress) {
        btn.onPress();
      }
    });

    const tree = renderSettings();
    await waitFor(() => tree.getByLabelText('Delete account'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Delete account'));
    });

    expect(tree.queryByLabelText('Password')).toBeNull();
    expect(firestoreMock.__getStore().has('users/a1')).toBe(true);
  });

  it('proceeds to reauth modal after confirming BOTH alerts', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    // Two chained destructive alerts now ("Delete forever" then
    // "Yes, delete forever"). Auto-confirm the destructive button each time.
    Alert.alert = jest.fn((title, msg, buttons) => {
      const confirm = buttons.find(b => b.style === 'destructive');
      if (confirm && confirm.onPress) {
        confirm.onPress();
      }
    });

    const tree = renderSettings();
    await waitFor(() => tree.getByLabelText('Delete account'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Delete account'));
    });

    // The reauth modal Password Input is rendered.
    expect(tree.getByLabelText('Password')).toBeTruthy();
  });

  it('successful reauth + delete clears the user doc and signs out', async () => {
    authMock.__seedUser('a@b.com', 'pw12345');
    await act(async () => {
      // Use the real signIn path so authMock's currentUser has a working
      // reauthenticateWithCredential + delete.
      await authMock().signInWithEmailAndPassword('a@b.com', 'pw12345');
    });
    const aUid = authMock().currentUser.uid;
    firestoreMock.__seedDoc(`users/${aUid}`, {email: 'a@b.com', role: 'athlete'});
    firestoreMock.__seedDoc(`users/${aUid}/skis/s1`, {name: 'A'});

    // Two chained destructive alerts now ("Delete forever" then
    // "Yes, delete forever"). Auto-confirm the destructive button each time.
    Alert.alert = jest.fn((title, msg, buttons) => {
      const confirm = buttons.find(b => b.style === 'destructive');
      if (confirm && confirm.onPress) {
        confirm.onPress();
      }
    });

    const tree = renderSettings();
    await waitFor(() => tree.getByLabelText('Delete account'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Delete account'));
    });
    fireEvent.changeText(tree.getByLabelText('Password'), 'pw12345');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Confirm delete account'));
    });

    // User doc + ski are gone.
    expect(firestoreMock.__getStore().has(`users/${aUid}`)).toBe(false);
    expect(firestoreMock.__getStore().has(`users/${aUid}/skis/s1`)).toBe(false);
    // And the screen reset navigation to Welcome.
    expect(mockNav.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'Welcome'}],
    });
  });
});
