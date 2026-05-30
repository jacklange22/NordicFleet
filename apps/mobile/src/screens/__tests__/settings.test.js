import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {Alert} from 'react-native';
import RNShare from 'react-native-share';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SettingsScreen from '../settings';
import {AuthProvider} from '../../context/AuthContext';

const mockNav = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
  canGoBack: jest.fn(() => true),
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
  RNShare.__reset();
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

describe('SettingsScreen (#4)', () => {
  it('groups account, privacy/data, and the delete action', () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const tree = renderSettings();
    expect(tree.getByLabelText('Change password')).toBeTruthy();
    expect(tree.getByLabelText('Sign out')).toBeTruthy();
    expect(tree.getByLabelText('Export my data')).toBeTruthy();
    expect(tree.getByLabelText('Privacy Policy')).toBeTruthy();
    expect(tree.getByLabelText('Delete account')).toBeTruthy();
    // Settings now carries the persistent bottom nav (nav consistency).
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
  });

  it('Change password opens the reauth modal', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const tree = renderSettings();
    fireEvent.press(tree.getByLabelText('Change password'));
    await waitFor(() => tree.getByLabelText('Current password'));
    expect(tree.getByLabelText('New password')).toBeTruthy();
  });

  it('Send beta feedback opens an entry point that never depends on nordicfleet.com', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const {Linking} = require('react-native');
    const openSpy = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);
    const tree = renderSettings();
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Send beta feedback'));
    });
    expect(openSpy).toHaveBeenCalled();
    const url = openSpy.mock.calls[0][0];
    expect(url).not.toContain('nordicfleet.com');
    openSpy.mockRestore();
  });

  it('Copy debug info shares a PII-free build block', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const tree = renderSettings();
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Copy debug info'));
    });
    expect(RNShare.open).toHaveBeenCalled();
    const arg = RNShare.open.mock.calls[0][0];
    expect(arg.message).toContain('NordicFleet debug info');
    expect(arg.message).toContain('Build:');
  });

  it('Sign out asks for confirmation before signing out', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = renderSettings();
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign out'));
    });
    expect(alertSpy).toHaveBeenCalled();
    const [title] = alertSpy.mock.calls[0];
    expect(title).toMatch(/sign out/i);
    alertSpy.mockRestore();
  });
});
