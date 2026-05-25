import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';

import ForgotPasswordScreen from '../forgotPassword';

jest.mock('../../context/AuthContext', () => {
  const sendPasswordResetEmail = jest.fn();
  return {
    useAuth: () => ({sendPasswordResetEmail}),
    // expose to the test for inspection / fail injection
    __mock: {sendPasswordResetEmail},
  };
});

// Pull the shared mock fn out via require() so we can drive its return value
// in each test. The factory above closes over `sendPasswordResetEmail` so
// both the screen and the test reach the same jest.fn.
const {__mock: authMock} = require('../../context/AuthContext');
const sendPasswordResetEmail = authMock.sendPasswordResetEmail;

const mockNav = {goBack: jest.fn(), canGoBack: () => true, navigate: jest.fn()};

beforeEach(() => {
  sendPasswordResetEmail.mockReset();
  mockNav.goBack.mockClear();
  mockNav.navigate.mockClear();
});

const renderScreen = () =>
  render(<ForgotPasswordScreen navigation={mockNav} />);

describe('ForgotPasswordScreen', () => {
  it('rejects an invalid email format inline (no Firebase call)', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'not-an-email');
    fireEvent.press(tree.getByLabelText('Send reset link'));
    await act(async () => {});
    expect(tree.getByText('Please enter a valid email')).toBeTruthy();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('on a valid email, calls sendPasswordResetEmail and shows the confirmation state', async () => {
    sendPasswordResetEmail.mockResolvedValue(undefined);
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'jack@nordicfleet.test');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Send reset link'));
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      'jack@nordicfleet.test',
    );
    await waitFor(() => tree.getByText('Check your email'));
    // The confirmation includes the submitted email so the user can verify.
    expect(tree.getByText(/jack@nordicfleet\.test/)).toBeTruthy();
    expect(tree.getByLabelText('Back to sign in')).toBeTruthy();
  });

  it('maps auth/user-not-found to a clear inline error', async () => {
    const err = new Error('not found');
    err.code = 'auth/user-not-found';
    sendPasswordResetEmail.mockRejectedValue(err);
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'ghost@nordicfleet.test');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Send reset link'));
    });
    expect(tree.getByText('No account found with that email')).toBeTruthy();
    // Stays on the form, not the confirmation state.
    expect(tree.queryByText('Check your email')).toBeNull();
  });
});
