import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import WaxLogScreen from '../waxinglog';
import {AuthProvider} from '../../context/AuthContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate}),
}));

const renderScreen = () =>
  render(
    <AuthProvider>
      <WaxLogScreen />
    </AuthProvider>,
  );

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockNavigate.mockClear();
});

describe('WaxLogScreen', () => {
  it('refuses to save when not signed in', async () => {
    const tree = renderScreen();
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
    await waitFor(() => tree.getByLabelText('Select Skis Waxed'));
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('writes one wax log per selected ski and navigates Home', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Select Skis Waxed'));
    fireEvent.press(tree.getByLabelText('Select Skis Waxed'));
    fireEvent.press(tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Done'));
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith('Home');
    // A waxLog doc was written.
    const waxLogs = [...firestoreMock.__getStore().keys()].filter(k =>
      k.startsWith('users/u1/waxLogs/'),
    );
    expect(waxLogs.length).toBe(1);
  });

  it('tolerates an offline write (still navigates Home)', async () => {
    authMock.__setCurrentUser({uid: 'u1'});
    firestoreMock.__seedDoc('users/u1/skis/a', {
      name: 'Speedmax',
      technique: 'Classic',
    });
    const err = new Error('offline');
    err.code = 'unavailable';
    firestoreMock.__injectError(err);
    const tree = renderScreen();
    await waitFor(() => tree.getByLabelText('Select Skis Waxed'));
    fireEvent.press(tree.getByLabelText('Select Skis Waxed'));
    fireEvent.press(tree.getByLabelText('Speedmax'));
    fireEvent.press(tree.getByLabelText('Done'));
    await act(async () => {});
    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });
});
