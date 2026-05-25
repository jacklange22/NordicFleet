import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import HomeScreen from '../homescreen';
import {AuthProvider} from '../../context/AuthContext';

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

// Provide initial safe-area metrics so TabBar's useSafeAreaInsets() resolves
// synchronously instead of waiting for the native module.
const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderHome = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <HomeScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('HomeScreen', () => {
  it('shows empty state when no skis', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const tree = renderHome();
    await waitFor(() =>
      tree.getByText('No skis in your fleet yet'),
    );
  });

  it('renders ski names from subscribeSkis', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
      type: 'Cold',
      grind: 'Universal',
    });
    firestoreMock.__seedDoc('users/u1/skis/b', {
      name: 'Carbon S',
      technique: 'Skate',
      type: 'Universal',
      grind: 'Fine',
      retired: false,
    });
    const tree = renderHome();
    await waitFor(() => tree.getByText('Speedmax'));
    expect(tree.getByText('Carbon S')).toBeTruthy();
  });

  it('hides retired skis', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/u1/skis/a', {name: 'Alive'});
    firestoreMock.__seedDoc('users/u1/skis/b', {
      name: 'Retired',
      retired: true,
    });
    const tree = renderHome();
    await waitFor(() => tree.getByText('Alive'));
    expect(tree.queryByText('Retired')).toBeNull();
  });
});
