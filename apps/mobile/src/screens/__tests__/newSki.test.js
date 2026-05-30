import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import authMock from '@react-native-firebase/auth';
import firestoreMock from '@react-native-firebase/firestore';

// Mock the OCR availability hook so we can flip the Scan entry point
// on / off independently of the test environment. Jest allows
// variables prefixed with `mock` to leak into the module factory.
let mockOcrAvailable = false;
jest.mock('../../services/ocrService', () => ({
  isOCRAvailable: () => mockOcrAvailable,
}));

import AddSkiForm from '../newSki';
import {AuthProvider} from '../../context/AuthContext';

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams = {};
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: mockNavigate,
  }),
  useRoute: () => ({params: mockRouteParams}),
}));

const renderWithAuth = ui => render(<AuthProvider>{ui}</AuthProvider>);

beforeEach(() => {
  authMock.__resetAuthMock();
  firestoreMock.__resetFirestoreMock();
  mockReplace.mockClear();
  mockNavigate.mockClear();
  mockRouteParams = {};
  mockOcrAvailable = false;
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
    fireEvent.changeText(tree.getByLabelText('Display name'), 'My Ski');
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

  describe('Scan-sticker entry point', () => {
    it('is hidden when OCR is unavailable', () => {
      mockOcrAvailable = false;
      const tree = renderWithAuth(<AddSkiForm />);
      expect(tree.queryByLabelText('Scan ski sticker with the camera')).toBeNull();
    });

    it('appears when OCR is available and navigates to ScanSki on press', () => {
      mockOcrAvailable = true;
      const tree = renderWithAuth(<AddSkiForm />);
      const card = tree.getByLabelText('Scan ski sticker with the camera');
      expect(card).toBeTruthy();
      fireEvent.press(card);
      expect(mockNavigate).toHaveBeenCalledWith('ScanSki');
    });
  });

  it('saves and navigates when name, brand, technique, and type are all set', async () => {
    authMock.__setCurrentUser({uid: 'user_x', email: 'a@b.com'});

    const tree = renderWithAuth(<AddSkiForm />);
    await act(async () => {});

    fireEvent.changeText(tree.getByLabelText('Display name'), 'My Ski');
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

  describe('edit mode (#P6)', () => {
    it('pre-fills from the existing ski and saves via update', async () => {
      authMock.__setCurrentUser({uid: 'user_x', email: 'a@b.com'});
      firestoreMock.__seedDoc('users/user_x/skis/s1', {
        name: 'Old name',
        brand: 'Madshus',
        model: 'Redline',
        technique: 'Skate',
        type: 'Cold',
        grind: 'P5',
      });
      mockRouteParams = {editSkiId: 's1'};

      const tree = renderWithAuth(<AddSkiForm />);
      await act(async () => {});

      // Header says Edit ski, and the form is pre-filled.
      expect(tree.getByText('Edit ski')).toBeTruthy();
      expect(tree.getByLabelText('Display name').props.value).toBe('Old name');
      expect(tree.getByLabelText('Model').props.value).toBe('Redline');

      // Change the name and save → updateSki writes, navigates back to detail.
      fireEvent.changeText(tree.getByLabelText('Display name'), 'New name');
      fireEvent.press(tree.getByLabelText('Save'));
      await act(async () => {});

      const stored = firestoreMock.__getStore().get('users/user_x/skis/s1');
      expect(stored.name).toBe('New name');
      expect(stored.brand).toBe('Madshus'); // preserved
      expect(mockReplace).toHaveBeenCalledWith('SkiInfo', {skiId: 's1'});
    });
  });
});
