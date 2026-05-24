import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import HomeScreen from '../homescreen';
import {AuthProvider} from '../../context/AuthContext';

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

const renderHome = () =>
  render(
    <NavigationContainer>
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    </NavigationContainer>,
  );

describe('HomeScreen', () => {
  it('shows empty state when no skis', async () => {
    authMock.__setCurrentUser({uid: 'u1', email: 'a@b.com'});
    const tree = renderHome();
    await waitFor(() =>
      tree.getByText('No skis yet — tap the + to add your first.'),
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
