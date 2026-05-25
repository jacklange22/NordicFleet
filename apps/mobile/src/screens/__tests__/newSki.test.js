import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

import AddSkiForm from '../newSki';
import {AuthProvider} from '../../context/AuthContext';

const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: jest.fn(),
  }),
}));

const renderWithAuth = ui => render(<AuthProvider>{ui}</AuthProvider>);

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockReplace.mockClear();
});

describe('AddSkiForm', () => {
  it('refuses to save when required fields are empty', () => {
    const tree = renderWithAuth(<AddSkiForm />);
    // Save without filling — should not have written anything.
    const saveButton = tree.getByLabelText('Save');
    fireEvent.press(saveButton);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('refuses to save when chip-selector fields (brand/technique/type) are still missing', async () => {
    // Sign in first so AuthProvider has a uid.
    authMock.__setCurrentUser({uid: 'user_x', email: 'a@b.com'});

    const tree = renderWithAuth(<AddSkiForm />);

    // Wait for AuthProvider to flip past loading.
    await act(async () => {});

    // Fill the plain-text fields but leave the brand / technique / type
    // pill selectors untouched. The form should still refuse to save.
    fireEvent.changeText(tree.getByLabelText('Ski name'), 'My Ski');
    fireEvent.changeText(tree.getByLabelText('Model'), 'Speedmax');
    fireEvent.changeText(tree.getByLabelText('Length'), '195');
    fireEvent.changeText(tree.getByLabelText('Flex'), '90');
    fireEvent.changeText(tree.getByLabelText('Base'), 'Plus');
    fireEvent.changeText(tree.getByLabelText('Build'), 'World Cup');
    fireEvent.changeText(tree.getByLabelText('Grind'), 'Universal');
    fireEvent.changeText(tree.getByLabelText('Notes (optional)'), 'Test');

    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('saves and navigates when name, brand, technique, and type are all set', async () => {
    authMock.__setCurrentUser({uid: 'user_x', email: 'a@b.com'});

    const tree = renderWithAuth(<AddSkiForm />);
    await act(async () => {});

    fireEvent.changeText(tree.getByLabelText('Ski name'), 'My Ski');
    // The brand pill row, technique pill row, and type pill row all expose
    // each option as an accessibility-label'd button.
    fireEvent.press(tree.getByLabelText('Fischer'));
    fireEvent.press(tree.getByLabelText('Classic'));
    fireEvent.press(tree.getByLabelText('Cold'));

    fireEvent.press(tree.getByLabelText('Save'));
    await act(async () => {});
    expect(mockReplace).toHaveBeenCalledWith(
      'SkiInfo',
      expect.objectContaining({skiId: expect.any(String)}),
    );
  });
});
