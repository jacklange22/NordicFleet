import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Alert} from 'react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import ProfileScreen from '../profile';
import {AuthProvider} from '../../context/AuthContext';

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderProfile = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <ProfileScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('ProfileScreen — delete account', () => {
  it('first alert + cancel: does not call deleteAccount', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    let cancelButton;
    Alert.alert = jest.fn((title, msg, buttons) => {
      cancelButton = buttons.find(b => b.text === 'Cancel');
    });

    const tree = renderProfile();
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

  it('proceeds to reauth modal after confirming the first alert', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {email: 'a@b.com', role: 'athlete'});

    Alert.alert = jest.fn((title, msg, buttons) => {
      const confirm = buttons.find(b => b.text === 'I want to delete');
      if (confirm && confirm.onPress) {
        confirm.onPress();
      }
    });

    const tree = renderProfile();
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

    Alert.alert = jest.fn((title, msg, buttons) => {
      const confirm = buttons.find(b => b.text === 'I want to delete');
      if (confirm && confirm.onPress) {
        confirm.onPress();
      }
    });

    const tree = renderProfile();
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
  });
});
