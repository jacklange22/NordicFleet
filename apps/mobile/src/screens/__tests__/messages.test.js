import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import MessagesScreen from '../messages';
import {AuthProvider} from '../../context/AuthContext';

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
});

const renderMessages = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <NavigationContainer>
        <AuthProvider>
          <MessagesScreen />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>,
  );

describe('MessagesScreen — unified sent + received', () => {
  it('shows both a received message and a message the user sent', async () => {
    authMock.__setCurrentUser({uid: 'me'});
    // Received from a coach.
    firestoreMock.__seedDoc('messages/r1', {
      fromUid: 'coach',
      toUid: 'me',
      subject: 'Cold wax tonight',
      body: 'Go with the green',
      read: false,
      createdAt: {seconds: 100},
    });
    // Sent by me to the coach.
    firestoreMock.__seedDoc('messages/s1', {
      fromUid: 'me',
      toUid: 'coach',
      subject: 'Thanks',
      body: 'Will do',
      read: false,
      createdAt: {seconds: 200},
    });

    const tree = renderMessages();
    await waitFor(() => tree.getByText('Cold wax tonight'));

    expect(tree.getByText('Cold wax tonight')).toBeTruthy();
    expect(tree.getByText('Thanks')).toBeTruthy();
    // Direction labels distinguish the two rows.
    expect(tree.getByText('Received')).toBeTruthy();
    expect(tree.getByText('Sent')).toBeTruthy();
  });

  it('labels a sent message the recipient has opened as "Sent · Read"', async () => {
    authMock.__setCurrentUser({uid: 'me'});
    firestoreMock.__seedDoc('messages/s1', {
      fromUid: 'me',
      toUid: 'coach',
      subject: 'Race recap',
      body: 'Felt fast',
      read: true,
      createdAt: {seconds: 300},
    });

    const tree = renderMessages();
    await waitFor(() => tree.getByText('Race recap'));
    expect(tree.getByText('Sent · Read')).toBeTruthy();
  });

  it('renders the empty state when the user has no messages', async () => {
    authMock.__setCurrentUser({uid: 'me'});
    const tree = renderMessages();
    await waitFor(() => tree.getByText('No messages yet'));
    expect(tree.getByText('No messages yet')).toBeTruthy();
  });
});
