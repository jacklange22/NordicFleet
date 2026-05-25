import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SkiInfo from '../skiInfo';
import {AuthProvider} from '../../context/AuthContext';

const navProp = {navigate: jest.fn()};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  navProp.navigate.mockClear();
});

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderSkiInfo = skiId =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <SkiInfo route={{params: {skiId}}} navigation={navProp} />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('SkiInfo', () => {
  it('shows "Ski not found" when ski is missing', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderSkiInfo('ghost');
    // "Ski not found" shows in both the Header title and the body — both
    // are correct; just confirm at least one is present.
    await waitFor(() => {
      expect(tree.getAllByText('Ski not found').length).toBeGreaterThan(0);
    });
  });

  it('renders ski fields when loaded', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/abc', {
      name: 'Fischer Speedmax',
      brand: 'Fischer',
      model: 'Speedmax',
      flex: 90,
      grind: 'Universal',
      length: 195,
      technique: 'Classic',
      type: 'cold',
      base: 'Plus',
      build: '2019 World Cup',
      notes: 'Some notes',
    });
    const tree = renderSkiInfo('abc');
    // Name shows in the Header and in the hero card.
    await waitFor(() => {
      expect(tree.getAllByText('Fischer Speedmax').length).toBeGreaterThan(0);
    });
    expect(tree.getByText('Fischer')).toBeTruthy();
    expect(tree.getByText('Universal')).toBeTruthy();
    expect(tree.getByText('Some notes')).toBeTruthy();
  });

  it('shows empty state for no logs', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'Speedmax'});
    const tree = renderSkiInfo('abc');
    await waitFor(() => tree.getByText('No wax logs yet'));
    expect(tree.getByText('No tests yet')).toBeTruthy();
  });

  it('renders wax log rows when present', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/abc', {name: 'Speedmax'});
    firestoreMock.__seedDoc('users/u1/waxLogs/log1', {
      skiId: 'abc',
      date: 1700000000,
      glideWaxes: ['CH6'],
      kickWax: null,
    });
    const tree = renderSkiInfo('abc');
    await waitFor(() => {
      expect(tree.getAllByText('Speedmax').length).toBeGreaterThan(0);
    });
    // CH6 is displayed in history detail (as part of the glide-wax list)
    expect(tree.getByText(/CH6/)).toBeTruthy();
  });
});
