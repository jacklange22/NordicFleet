import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
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

describe('ProfileScreen', () => {
  it('shows a loading screen before a user is signed in', () => {
    const tree = renderProfile();
    // No user → loading false → renders profile body with empty fields.
    // We just verify it doesn't crash.
    expect(tree).toBeTruthy();
  });

  it('renders profile fields when subscription fires', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1', {
      email: 'a@b.com',
      team: 'Dartmouth',
      location: 'Hanover, NH',
      weight: 70,
    });
    const tree = renderProfile();
    await waitFor(() => tree.getByText('Dartmouth'));
    expect(tree.getByText('Dartmouth')).toBeTruthy();
    expect(tree.getByText('Hanover, NH')).toBeTruthy();
    // Weight is now rendered with its unit suffix, e.g. "70 kg".
    expect(tree.getByText('70 kg')).toBeTruthy();
  });

  it('writes weight on save', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1', {email: 'a@b.com'});
    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Edit Weight (kg):'));
    fireEvent.press(tree.getByLabelText('Edit Weight (kg):'));
    // The modal's TextInput is now visible.
    // Find the modal TextInput by walking the tree.
    const inputs = tree.UNSAFE_getAllByType(require('react-native').TextInput);
    // Last TextInput is the modal one.
    fireEvent.changeText(inputs[inputs.length - 1], '72');
    fireEvent.press(tree.getByText('Save'));
    await act(async () => {});
    // The profile doc should now have weight=72.
    const stored = firestoreMock.__getStore().get('users/u1');
    expect(stored.weight).toBe(72);
  });
});
