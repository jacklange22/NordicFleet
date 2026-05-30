import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import WaxLogScreen from '../waxinglog';
import {AuthProvider} from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

const SA_METRICS = {
  frame: {x: 0, y: 0, width: 320, height: 640},
  insets: {top: 0, left: 0, right: 0, bottom: 0},
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={SA_METRICS}>
      <AuthProvider>
        <WaxLogScreen />
      </AuthProvider>
    </SafeAreaProvider>,
  );

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockNavigate.mockClear();
});

describe('WaxLogScreen', () => {
  it('refuses to save when not signed in', async () => {
    const tree = renderScreen();
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('refuses to save when no ski is selected', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const tree = renderScreen();
    // Wait for the ski to render as a pill.
    await waitFor(() => tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks an empty wax log (no wax, no note) — #13', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Speedmax'));
    await act(async () => {});
    // Save with nothing filled in → blocked, no write, no navigation.
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
    const waxLogs = [...firestoreMock.__getStore().keys()].filter(k =>
      k.startsWith('users/u1/waxLogs/'),
    );
    expect(waxLogs.length).toBe(0);
  });

  it('writes one wax log and opens the ski detail (single ski) — #12/#13', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Speedmax'));
    // Tap the ski pill to select it.
    fireEvent.press(tree.getByLabelText('Speedmax'));
    await act(async () => {});
    // Add a note so the log has meaningful content.
    fireEvent.changeText(tree.getByLabelText('Notes'), 'cold dry');
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    // Single ski → navigates to that ski's detail (history visible).
    expect(mockNavigate).toHaveBeenCalledWith('SkiInfo', {skiId: 'a'});
    const waxLogs = [...firestoreMock.__getStore().keys()].filter(k =>
      k.startsWith('users/u1/waxLogs/'),
    );
    expect(waxLogs.length).toBe(1);
  });

  it('tolerates an offline write (still navigates to ski detail)', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const err = new Error('offline');
    err.code = 'unavailable';
    firestoreMock.__injectError(err);
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Speedmax'));
    await act(async () => {});
    fireEvent.changeText(tree.getByLabelText('Notes'), 'cold dry');
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith('SkiInfo', {skiId: 'a'});
  });
});
