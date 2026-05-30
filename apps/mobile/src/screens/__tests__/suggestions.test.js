import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SuggestionsScreen from '../suggestions';
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
          <SuggestionsScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('SuggestionsScreen', () => {
  it('shows a pending suggestion with the ski name, change, and comment', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/ski1', {name: 'Speedmax', flex: 70});
    firestoreMock.__seedDoc('fleetSuggestions/s1', {
      coachUid: 'coach',
      athleteUid: 'u1',
      targetType: 'ski',
      targetId: 'ski1',
      suggestedChanges: {flex: 80},
      comment: 'Stiffen for cold',
      status: 'pending',
      createdAt: {seconds: 100},
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByText('Speedmax'));
    expect(tree.getByText('Flex: 80')).toBeTruthy();
    expect(tree.getByText('Stiffen for cold')).toBeTruthy();
  });

  it('accepting applies the change to the ski and marks the suggestion accepted', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/ski1', {name: 'Speedmax', flex: 70});
    firestoreMock.__seedDoc('fleetSuggestions/s1', {
      coachUid: 'coach',
      athleteUid: 'u1',
      targetType: 'ski',
      targetId: 'ski1',
      suggestedChanges: {flex: 80},
      comment: 'Stiffen',
      status: 'pending',
      createdAt: {seconds: 100},
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Accept suggestion for Speedmax'));
    fireEvent.press(tree.getByLabelText('Accept suggestion for Speedmax'));
    await act(async () => {});
    expect(firestoreMock.__getStore().get('users/u1/skis/ski1').flex).toBe(80);
    expect(
      firestoreMock.__getStore().get('fleetSuggestions/s1').status,
    ).toBe('accepted');
  });

  it('rejecting marks the suggestion rejected and leaves the ski unchanged', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/ski1', {name: 'Speedmax', flex: 70});
    firestoreMock.__seedDoc('fleetSuggestions/s1', {
      coachUid: 'coach',
      athleteUid: 'u1',
      targetType: 'ski',
      targetId: 'ski1',
      suggestedChanges: {flex: 80},
      comment: 'Stiffen',
      status: 'pending',
      createdAt: {seconds: 100},
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Reject suggestion for Speedmax'));
    fireEvent.press(tree.getByLabelText('Reject suggestion for Speedmax'));
    await act(async () => {});
    expect(
      firestoreMock.__getStore().get('fleetSuggestions/s1').status,
    ).toBe('rejected');
    expect(firestoreMock.__getStore().get('users/u1/skis/ski1').flex).toBe(70);
  });

  it('shows the empty state when there are no suggestions', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderScreen();
    await waitFor(() => tree.getByText('No suggestions yet'));
  });
});
