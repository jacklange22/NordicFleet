import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import EditTestLogScreen from '../editTestLog';
import {AuthProvider} from '../../context/AuthContext';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate, goBack: mockGoBack}),
}));

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockNavigate.mockClear();
  mockGoBack.mockClear();
});

const renderScreen = params =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <AuthProvider>
        <EditTestLogScreen route={{params}} />
      </AuthProvider>
    </SafeAreaProvider>,
  );

describe('EditTestLogScreen', () => {
  it('loads a log, edits temperature, and saves preserving createdAt and location', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {
      name: 'Carbonlite',
      technique: 'Skate',
    });
    firestoreMock.__seedDoc('users/u1/testLogs/t1', {
      skiId: 's1',
      date: {seconds: 222},
      createdAt: {seconds: 200},
      location: {latitude: 1, longitude: 2},
      temperature: -2,
      glideRating: 6,
      notes: 'old',
    });

    const tree = renderScreen({logId: 't1', skiId: 's1'});
    await waitFor(() => tree.getByLabelText('Temperature'));
    // Bottom nav stays visible on the edit screen (nav consistency).
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
    fireEvent.changeText(tree.getByLabelText('Temperature'), '-12');
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});

    const stored = firestoreMock.__getStore().get('users/u1/testLogs/t1');
    expect(stored.temperature).toBe(-12);
    expect(stored.createdAt).toEqual({seconds: 200});
    expect(stored.date).toEqual({seconds: 222});
    // location is preserved (edit screen does not expose a location editor).
    expect(stored.location).toEqual({latitude: 1, longitude: 2});
    expect(stored.updatedAt).toBeDefined();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows a not-found message for a missing log', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderScreen({logId: 'ghost', skiId: 's1'});
    await waitFor(() =>
      tree.getByText('This test log could not be found.'),
    );
  });
});
