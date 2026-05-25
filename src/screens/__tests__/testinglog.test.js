import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import TestingLogScreen from '../testinglog';
import {AuthProvider} from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <AuthProvider>
        <TestingLogScreen />
      </AuthProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockNavigate.mockClear();
});

describe('TestingLogScreen', () => {
  it('refuses to save when no ski is selected', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const tree = renderScreen();
    // Wait for the ski to render as a selectable pill.
    await waitFor(() => tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('writes a test log with classic-only fields nulled for skate', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Skate',
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Speedmax'));
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith('Home');
    const logKey = [...firestoreMock.__getStore().keys()].find(k =>
      k.startsWith('users/u1/testLogs/'),
    );
    expect(logKey).toBeDefined();
    const log = firestoreMock.__getStore().get(logKey);
    expect(log.kickWax).toBeNull();
    expect(log.kickRating).toBeNull();
  });
});
