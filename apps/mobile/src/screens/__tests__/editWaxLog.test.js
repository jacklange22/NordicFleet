import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import EditWaxLogScreen from '../editWaxLog';
import {__resetDrafts} from '../../services/draftStore';
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
  __resetDrafts();
  mockNavigate.mockClear();
  mockGoBack.mockClear();
});

const renderScreen = params =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <AuthProvider>
        <EditWaxLogScreen route={{params}} />
      </AuthProvider>
    </SafeAreaProvider>,
  );

describe('EditWaxLogScreen', () => {
  it('loads a log, edits a field, and saves while preserving createdAt', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
      skiId: 's1',
      date: {seconds: 111},
      createdAt: {seconds: 100},
      binder: 'VG Swix',
      glideLayers: 1,
      glideWaxes: ['CH8'],
      kickLayers: 0,
      notes: 'old note',
    });

    const tree = renderScreen({logId: 'w1', skiId: 's1'});
    await waitFor(() => tree.getByLabelText('Notes'));
    // Bottom nav stays visible on the edit screen (nav consistency).
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
    fireEvent.changeText(tree.getByLabelText('Notes'), 'fresh note');
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});

    const stored = firestoreMock.__getStore().get('users/u1/waxLogs/w1');
    expect(stored.notes).toBe('fresh note');
    // createdAt and the original date are untouched by an edit.
    expect(stored.createdAt).toEqual({seconds: 100});
    expect(stored.date).toEqual({seconds: 111});
    expect(stored.updatedAt).toBeDefined();
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows a not-found message for a missing log', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    const tree = renderScreen({logId: 'ghost', skiId: 's1'});
    await waitFor(() =>
      tree.getByText('This wax log could not be found.'),
    );
  });

  it('autosaves an edit as a draft and restores it on remount', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
      skiId: 's1',
      glideWaxes: ['CH8'],
      notes: 'old note',
      date: {seconds: 1},
    });

    const first = renderScreen({logId: 'w1', skiId: 's1'});
    await waitFor(() => first.getByLabelText('Notes'));
    fireEvent.changeText(first.getByLabelText('Notes'), 'draft in progress');
    await act(async () => {});
    first.unmount();

    // Re-open the same log: the draft is restored, not the stored value.
    const second = renderScreen({logId: 'w1', skiId: 's1'});
    await waitFor(() => second.getByText('Draft restored.'));
    expect(second.getByLabelText('Notes').props.value).toBe(
      'draft in progress',
    );
  });

  it('clears the draft after a successful save', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/s1', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    firestoreMock.__seedDoc('users/u1/waxLogs/w1', {
      skiId: 's1',
      glideWaxes: ['CH8'],
      notes: 'old note',
      date: {seconds: 1},
    });

    const first = renderScreen({logId: 'w1', skiId: 's1'});
    await waitFor(() => first.getByLabelText('Notes'));
    fireEvent.changeText(first.getByLabelText('Notes'), 'saved value');
    await act(async () => {});
    fireEvent.press(first.getByLabelText('Save'));
    await act(async () => {});
    first.unmount();

    // Re-open: no draft banner, shows the saved value.
    const second = renderScreen({logId: 'w1', skiId: 's1'});
    await waitFor(() => second.getByLabelText('Notes'));
    expect(second.queryByText('Draft restored.')).toBeNull();
    expect(second.getByLabelText('Notes').props.value).toBe('saved value');
  });
});
