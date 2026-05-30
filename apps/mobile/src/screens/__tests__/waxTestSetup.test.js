import React from 'react';
import {render, fireEvent, act, waitFor} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const mockCreate = jest.fn();
const mockReplace = jest.fn();
const mockReport = jest.fn();

jest.mock('../../services/waxTestService', () => ({
  createWaxTest: (...a) => mockCreate(...a),
}));
jest.mock('../../services/reportError', () => ({
  reportError: (...a) => mockReport(...a),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({user: {uid: 'coach1'}}),
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({replace: mockReplace}),
}));

// Mock the WaxPicker so a test can set a wax name without the typeahead.
jest.mock('../../components/ui', () => {
  const actual = jest.requireActual('../../components/ui');
  const {Pressable, Text} = require('react-native');
  const WaxPicker = ({onChange, label}) => (
    <Pressable
      accessibilityLabel={`pick-${label}`}
      onPress={() => onChange({id: null, name: 'Swix HF6'})}>
      <Text>pick</Text>
    </Pressable>
  );
  return {...actual, WaxPicker};
});

const WaxTestSetupScreen = require('../waxTestSetup').default;

const SA = {frame: {x: 0, y: 0, width: 390, height: 844}, insets: {top: 47, left: 0, right: 0, bottom: 34}};
const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={SA}>
      <WaxTestSetupScreen />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockCreate.mockReset();
  mockReplace.mockReset();
  mockReport.mockReset();
});

// Fill the form to a valid state for the given type.
const fillValid = async (tree, typeLabel) => {
  fireEvent.changeText(tree.getByLabelText('Test name'), 'AM glide test');
  fireEvent.press(tree.getByLabelText(`${typeLabel} test type`));
  // Two default combinations, each with one layer → set a wax on each picker.
  const pickers = tree.getAllByLabelText(new RegExp(`^pick-${typeLabel}$`));
  await act(async () => {
    pickers.forEach(p => fireEvent.press(p));
  });
};

describe('WaxTestSetup — create (#P1)', () => {
  it('renders the four test types', () => {
    const tree = renderScreen();
    expect(tree.getByLabelText('Kick test type')).toBeTruthy();
    expect(tree.getByLabelText('Paraffin test type')).toBeTruthy();
    expect(tree.getByLabelText('Structure test type')).toBeTruthy();
    expect(tree.getByLabelText('Topcoat test type')).toBeTruthy();
  });

  it('cannot create without a test type (create disabled, no service call)', async () => {
    const tree = renderScreen();
    fireEvent.changeText(tree.getByLabelText('Test name'), 'No type test');
    // Set wax on both default pickers (labelled by the default 'Paraffin').
    const pickers = tree.getAllByLabelText(/^pick-Paraffin$/);
    await act(async () => pickers.forEach(p => fireEvent.press(p)));

    // The Create button is disabled until a type is chosen, so it can't fire.
    const createBtn = tree.getByLabelText('Create wax test');
    expect(createBtn.props.accessibilityState.disabled).toBe(true);
    await act(async () => fireEvent.press(createBtn));
    expect(mockCreate).not.toHaveBeenCalled();

    // Choosing a type enables it.
    fireEvent.press(tree.getByLabelText('Paraffin test type'));
    expect(
      tree.getByLabelText('Create wax test').props.accessibilityState.disabled,
    ).toBe(false);
  });

  it('creates a Kick test and navigates to the runner', async () => {
    mockCreate.mockResolvedValueOnce('test123');
    const tree = renderScreen();
    await fillValid(tree, 'Kick');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Create wax test'));
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [uid, data] = mockCreate.mock.calls[0];
    expect(uid).toBe('coach1');
    expect(data.testType).toBe('kick');
    expect(data.combinations.length).toBe(2);
    expect(data.combinations[0].layers[0].category).toBe('kick');
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith('WaxTestRunner', {
        testId: 'test123',
      }),
    );
  });

  it('creates a Structure test (type drives the layer category)', async () => {
    mockCreate.mockResolvedValueOnce('t2');
    const tree = renderScreen();
    await fillValid(tree, 'Structure');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Create wax test'));
    });
    expect(mockCreate.mock.calls[0][1].testType).toBe('structure');
  });

  it('create failure shows a clear error and does NOT crash', async () => {
    mockCreate.mockRejectedValueOnce(new Error('network down'));
    const tree = renderScreen();
    await fillValid(tree, 'Paraffin');
    await act(async () => {
      fireEvent.press(tree.getByLabelText('Create wax test'));
    });
    await waitFor(() => tree.getByText(/Couldn't create the test/i));
    expect(mockReport).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
