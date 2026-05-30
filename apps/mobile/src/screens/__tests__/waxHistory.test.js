import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import WaxHistoryScreen from '../waxHistory';
import {AuthProvider} from '../../context/AuthContext';

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <WaxHistoryScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('WaxHistoryScreen', () => {
  it('lists every wax log labelled by ski name with its wax detail', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {name: 'Speedmax'});
    firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
      skiId: 's1',
      glideWaxes: ['HF8'],
      date: 1700000000000,
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByText('Speedmax'));
    expect(tree.getByText(/HF8/)).toBeTruthy();
  });

  it('falls back to "Unknown ski" when the ski is gone', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
      skiId: 'missing',
      glideWaxes: ['LF6'],
      date: 1700000000000,
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByText('Unknown ski'));
  });

  it('shows the empty state when there are no wax logs', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderScreen();
    await waitFor(() => tree.getByText('No wax logs yet'));
  });
});
