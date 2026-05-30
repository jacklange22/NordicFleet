import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import TestHistoryScreen from '../testHistory';
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
          <TestHistoryScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('TestHistoryScreen', () => {
  it('lists every test log labelled by ski name with its conditions', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {name: 'Carbonlite'});
    firestoreMock.__seedDoc('users/u1/testLogs/t1', {
      skiId: 's1',
      snowType: 'cold',
      surface: 'hardpack',
      temperature: -5,
      glideRating: 8,
      date: 1700000000000,
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByText('Carbonlite'));
    expect(tree.getByText(/cold/)).toBeTruthy();
  });

  it('shows the empty state when there are no tests', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderScreen();
    await waitFor(() => tree.getByText('No tests yet'));
  });
});
