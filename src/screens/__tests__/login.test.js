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
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'password1');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Login'));
    });
    expect(tree.getByText('Please enter a valid email')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('refuses a short password', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), '123');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Login'));
    });
    expect(
      tree.getByText('Password must be at least 6 characters'),
    ).toBeTruthy();
  });

  it('maps invalid-credential to friendly error', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'nope@b.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'wrongpw');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Login'));
    });
    expect(tree.getByText('Wrong email or password')).toBeTruthy();
  });

  it('signs in with valid creds and routes to Home', async () => {
    authMock.__seedUser('a@b.com', 'password1', 'uid_a');
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'password1');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Login'));
    });
    expect(mockReplace).toHaveBeenCalledWith('Home');
  });
});
