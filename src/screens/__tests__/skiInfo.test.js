import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
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

const renderSkiInfo = skiId =>
  render(
    <AuthProvider>
      <SkiInfo route={{params: {skiId}}} navigation={navProp} />
    </AuthProvider>,
  );

describe('SkiInfo', () => {
  it('shows "Ski not found" when ski is missing', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderSkiInfo('ghost');
    await waitFor(() => tree.getByText('Ski not found'));
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
    await waitFor(() => tree.getByText('Fischer Speedmax'));
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
    await waitFor(() => tree.getByText('Speedmax'));
    // CH6 is displayed in history detail
    expect(tree.getByText('CH6')).toBeTruthy();
  });
});
