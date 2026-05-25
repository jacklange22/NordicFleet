import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import ProfileScreen from '../profile';
import {AuthProvider} from '../../context/AuthContext';

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderProfile = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <ProfileScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

const seedCoach = (uid, email = 'mycoach@nordicfleet.test') => {
  firestoreMock.__seedDoc(`users/${uid}`, {
    email,
    role: 'coach',
    displayName: 'My Coach',
  });
};

describe('ProfileScreen — add/change/remove coach', () => {
  it('tap "Add a coach" opens the modal', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {
      email: 'a@b.com',
      role: 'athlete',
      coachId: null,
    });
    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Add a coach'));
    fireEvent.press(tree.getByLabelText('Add a coach'));
    // The modal renders an Input with the label "Coach email".
    expect(tree.getByLabelText('Coach email')).toBeTruthy();
  });

  it('valid coach email creates a pending coachRequest (not direct coachId)', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {
      email: 'a@b.com',
      role: 'athlete',
      coachId: null,
    });
    seedCoach('c1');

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Add a coach'));
    fireEvent.press(tree.getByLabelText('Add a coach'));

    fireEvent.changeText(
      tree.getByLabelText('Coach email'),
      'mycoach@nordicfleet.test',
    );
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Save coach'));
    });

    // Athlete's coachId stays null until the coach accepts.
    const stored = firestoreMock.__getStore().get('users/a1');
    expect(stored.coachId).toBeNull();
    // A pending coachRequest doc was created.
    const requests = [...firestoreMock.__getStore().keys()]
      .filter(k => k.startsWith('coachRequests/'))
      .map(k => firestoreMock.__getStore().get(k));
    expect(requests.length).toBe(1);
    expect(requests[0]).toMatchObject({
      status: 'pending',
      athleteUid: 'a1',
      coachUid: 'c1',
    });
  });

  it('coach lookup miss shows the clear inline error', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {
      email: 'a@b.com',
      role: 'athlete',
      coachId: null,
    });
    // No coach seeded → requestCoach's findCoachByEmail returns null →
    // service throws coach/not-found → modal shows the friendly error.

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Add a coach'));
    fireEvent.press(tree.getByLabelText('Add a coach'));
    fireEvent.changeText(
      tree.getByLabelText('Coach email'),
      'ghost@nordicfleet.test',
    );
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Save coach'));
    });

    expect(
      tree.getByText(
        'No coach account found with that email. Make sure your coach has signed up first.',
      ),
    ).toBeTruthy();
  });

  it('invalid email format stays inline (no Firestore call)', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    firestoreMock.__seedDoc('users/a1', {
      email: 'a@b.com',
      role: 'athlete',
      coachId: null,
    });

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Add a coach'));
    fireEvent.press(tree.getByLabelText('Add a coach'));
    fireEvent.changeText(tree.getByLabelText('Coach email'), 'not-an-email');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Save coach'));
    });
    expect(tree.getByText('Please enter a valid email')).toBeTruthy();
    // coachId still null.
    const stored = firestoreMock.__getStore().get('users/a1');
    expect(stored.coachId).toBeNull();
  });

  it('with linked coach (accepted request), "Remove coach" clears the coachId', async () => {
    authMock.__setCurrentUser({uid: 'a1', email: 'a@b.com'});
    seedCoach('c1');
    firestoreMock.__seedDoc('users/a1', {
      email: 'a@b.com',
      role: 'athlete',
      coachId: 'c1',
    });
    // Seed an accepted coachRequest so the outgoing-requests observer
    // doesn't immediately null out the coachId via syncCoachIdFromRequests.
    firestoreMock.__seedDoc('coachRequests/r1', {
      athleteUid: 'a1',
      coachUid: 'c1',
      athleteEmail: 'a@b.com',
      coachEmail: 'mycoach@nordicfleet.test',
      status: 'accepted',
      updatedAt: {seconds: 100},
    });

    // Mock Alert so the destructive button auto-fires.
    const Alert = require('react-native').Alert;
    Alert.alert = jest.fn((title, msg, buttons) => {
      const remove = buttons.find(b => b.text === 'Remove');
      if (remove && remove.onPress) {
        remove.onPress();
      }
    });

    const tree = renderProfile();
    await waitFor(() => tree.getByLabelText('Remove coach'));
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Remove coach'));
    });

    const stored = firestoreMock.__getStore().get('users/a1');
    expect(stored.coachId).toBeNull();
  });
});
