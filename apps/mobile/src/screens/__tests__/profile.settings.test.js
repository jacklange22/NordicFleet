import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import ProfileScreen from '../profile';
import {AuthProvider} from '../../context/AuthContext';

// Capture navigation so we can assert the Settings gear routes correctly.
const mockNav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
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

// Issue #4: account/privacy/delete moved off Profile behind a Settings gear.
describe('ProfileScreen — Settings gear (#4)', () => {
  it('shows a Settings gear that navigates to the Settings screen', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1', {email: 'a@b.com', role: 'athlete'});

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Settings'));
    fireEvent.press(tree.getByLabelText('Settings'));
    expect(mockNav.navigate).toHaveBeenCalledWith('Settings');
  });

  it('no longer renders account/delete actions inline on Profile', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1', {email: 'a@b.com', role: 'athlete'});

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Settings'));
    // These live in Settings now, not on Profile.
    expect(tree.queryByLabelText('Delete account')).toBeNull();
    expect(tree.queryByLabelText('Change password')).toBeNull();
    expect(tree.queryByLabelText('Export my data')).toBeNull();
  });
});
