import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SuggestChangeScreen from '../suggestChange';
import {AuthProvider} from '../../context/AuthContext';

const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: jest.fn(), goBack: mockGoBack}),
}));

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockGoBack.mockClear();
});

const renderScreen = params =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <AuthProvider>
        <SuggestChangeScreen route={{params}} />
      </AuthProvider>
    </SafeAreaProvider>,
  );

describe('SuggestChangeScreen', () => {
  it('creates a pending suggestion from the coach with the entered change', async () => {
    authMock.__setCurrentUser({uid: 'coach'});
    const tree = renderScreen({
      skiId: 'ski1',
      ownerUid: 'alice',
      skiName: 'Speedmax',
    });
    await waitFor(() => tree.getByLabelText('Flex'));
    fireEvent.changeText(tree.getByLabelText('Flex'), '85');
    fireEvent.changeText(
      tree.getByLabelText('Note to your athlete'),
      'Stiffen for cold',
    );
    fireEvent.press(tree.getByText('Send suggestion'));
    await act(async () => {});

    const stored = [...firestoreMock.__getStore().entries()].filter(([k]) =>
      k.startsWith('fleetSuggestions/'),
    );
    expect(stored.length).toBe(1);
    const [, doc] = stored[0];
    expect(doc).toMatchObject({
      coachUid: 'coach',
      athleteUid: 'alice',
      targetType: 'ski',
      targetId: 'ski1',
      suggestedChanges: {flex: 85},
      comment: 'Stiffen for cold',
      status: 'pending',
    });
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('does not submit an empty suggestion (no change, no comment)', async () => {
    authMock.__setCurrentUser({uid: 'coach'});
    const tree = renderScreen({
      skiId: 'ski1',
      ownerUid: 'alice',
      skiName: 'Speedmax',
    });
    await waitFor(() => tree.getByText('Send suggestion'));
    fireEvent.press(tree.getByText('Send suggestion'));
    await act(async () => {});
    const stored = [...firestoreMock.__getStore().keys()].filter(k =>
      k.startsWith('fleetSuggestions/'),
    );
    expect(stored.length).toBe(0);
    expect(mockGoBack).not.toHaveBeenCalled();
  });
});
