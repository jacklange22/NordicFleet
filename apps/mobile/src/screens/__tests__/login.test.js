import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import LoginScreen from '../login';
import {AuthProvider} from '../../context/AuthContext';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();

const navProp = {
  replace: mockReplace,
  navigate: mockNavigate,
};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockReplace.mockClear();
  mockNavigate.mockClear();
});

const renderScreen = () =>
  render(
    <AuthProvider>
      <LoginScreen navigation={navProp} />
    </AuthProvider>,
  );

describe('LoginScreen', () => {
  it('refuses an invalid email', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'not-an-email');
    fireEvent.changeText(tree.getByLabelText('Password'), 'password1');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign in'));
    });
    expect(tree.getByText('Please enter a valid email')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('refuses a short password', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'a@b.com');
    fireEvent.changeText(tree.getByLabelText('Password'), '123');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign in'));
    });
    expect(
      tree.getByText('Password must be at least 6 characters'),
    ).toBeTruthy();
  });

  it('maps invalid-credential to friendly error', async () => {
    // login.js deliberately console.warns the real auth code on failure
    // so it's never silently swallowed. That's expected here — assert it
    // fired (and keep it out of the test output).
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'nope@b.com');
    fireEvent.changeText(tree.getByLabelText('Password'), 'wrongpw');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign in'));
    });
    expect(tree.getByText('Wrong email or password')).toBeTruthy();
    expect(warnSpy).toHaveBeenCalledWith(
      '[auth] sign-in failed:',
      'auth/invalid-credential',
    );
    warnSpy.mockRestore();
  });

  it('signs in with valid creds and routes to Home', async () => {
    authMock.__seedUser('a@b.com', 'password1', 'uid_a');
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Email'), 'a@b.com');
    fireEvent.changeText(tree.getByLabelText('Password'), 'password1');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign in'));
    });
    expect(mockReplace).toHaveBeenCalledWith('Home');
  });
});
