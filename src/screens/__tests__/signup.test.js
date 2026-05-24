import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import SignupScreen from '../signup';
import {AuthProvider} from '../../context/AuthContext';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
const navProp = {replace: mockReplace, navigate: mockNavigate};

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockReplace.mockClear();
  mockNavigate.mockClear();
});

const renderScreen = () =>
  render(
    <AuthProvider>
      <SignupScreen navigation={navProp} />
    </AuthProvider>,
  );

describe('SignupScreen', () => {
  it('requires matching passwords', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'password1');
    fireEvent.changeText(
      tree.getByPlaceholderText('Confirm Password'),
      'different',
    );
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign up'));
    });
    expect(tree.getByText('Passwords do not match')).toBeTruthy();
  });

  it('creates a user, profile doc, and routes Home', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'new@user.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'password1');
    fireEvent.changeText(
      tree.getByPlaceholderText('Confirm Password'),
      'password1',
    );
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign up'));
    });
    expect(mockReplace).toHaveBeenCalledWith('Home');
    // Profile doc was written.
    const profileEntries = [...firestoreMock.__getStore().keys()].filter(k =>
      k.startsWith('users/'),
    );
    expect(profileEntries.length).toBeGreaterThan(0);
  });

  it('maps email-already-in-use', async () => {
    authMock.__seedUser('taken@user.com', 'doesntmatter');
    const tree = renderScreen();
    fireEvent.changeText(tree.getByPlaceholderText('Email'), 'taken@user.com');
    fireEvent.changeText(tree.getByPlaceholderText('Password'), 'password1');
    fireEvent.changeText(
      tree.getByPlaceholderText('Confirm Password'),
      'password1',
    );
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Sign up'));
    });
    expect(
      tree.getByText('An account with that email already exists'),
    ).toBeTruthy();
  });
});
