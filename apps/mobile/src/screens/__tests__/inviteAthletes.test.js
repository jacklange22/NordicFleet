import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import InviteAthletesScreen from '../inviteAthletes';
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
          <InviteAthletesScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('InviteAthletesScreen', () => {
  it('parses pasted emails into valid + invalid counts', async () => {
    authMock.__setCurrentUser({uid: 'coach'});
    firestoreMock.__seedDoc('users/coach', {name: 'Coach Pat', isCoach: true});
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Athlete emails'));
    fireEvent.changeText(
      tree.getByLabelText('Athlete emails'),
      'a@x.com, nope, b@x.com',
    );
    await act(async () => {});
    expect(tree.getByText('2 valid, 1 to fix')).toBeTruthy();
  });

  it('creates one pending invite per valid email and lists them', async () => {
    authMock.__setCurrentUser({uid: 'coach'});
    firestoreMock.__seedDoc('users/coach', {name: 'Coach Pat', isCoach: true});
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Athlete emails'));
    fireEvent.changeText(
      tree.getByLabelText('Athlete emails'),
      'a@x.com, b@x.com',
    );
    await act(async () => {});
    fireEvent.press(tree.getByText('Create invite links'));
    await act(async () => {});

    const stored = [...firestoreMock.__getStore().entries()].filter(([k]) =>
      k.startsWith('athleteInvites/'),
    );
    expect(stored.length).toBe(2);
    for (const [, doc] of stored) {
      expect(doc.coachUid).toBe('coach');
      expect(doc.status).toBe('pending');
    }
    // The invite list surfaces the athlete emails.
    await waitFor(() => tree.getByText('a@x.com'));
    expect(tree.getByText('b@x.com')).toBeTruthy();
  });

  it('shows the empty state with no invites yet', async () => {
    authMock.__setCurrentUser({uid: 'coach'});
    firestoreMock.__seedDoc('users/coach', {name: 'Coach', isCoach: true});
    const tree = renderScreen();
    await waitFor(() => tree.getByText('No invites yet'));
  });
});
