import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const SAFE_METRICS = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 47, left: 0, right: 0, bottom: 34},
};

let mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('../../../context/ModeContext', () => ({
  useMode: () => mockMode,
}));
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({user: {uid: 'u1'}}),
}));
jest.mock('../../../services/messageService', () => ({
  subscribeUnreadCountForAthlete: (uid, cb) => {
    cb(0);
    return () => {};
  },
}));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({navigate: mockNavigate, reset: mockReset}),
  useRoute: () => ({name: 'Home'}),
}));

const TabBar = require('../TabBar').default;

const renderTabBar = () =>
  render(
    <SafeAreaProvider initialMetrics={SAFE_METRICS}>
      <TabBar />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
  mockNavigate.mockClear();
  mockReset.mockClear();
});

describe('TabBar — conditional tabs per mode', () => {
  it('personal mode shows the full skier tab set', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
    const tree = renderTabBar();
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
    expect(tree.getByLabelText('Ski')).toBeTruthy();
    expect(tree.queryByLabelText('Add')).toBeNull();
    expect(tree.getByLabelText('Wax')).toBeTruthy();
    expect(tree.getByLabelText('Test')).toBeTruthy();
    expect(tree.getByLabelText('Messages')).toBeTruthy();
    expect(tree.getByLabelText('Profile')).toBeTruthy();
  });

  it('coaching mode shows athletes + profile, hides add/wax/test', () => {
    mockMode = {mode: 'coaching', setMode: jest.fn(), isCoach: true};
    const tree = renderTabBar();
    expect(tree.getByLabelText('Athletes')).toBeTruthy();
    expect(tree.getByLabelText('Profile')).toBeTruthy();
    expect(tree.queryByLabelText('Ski')).toBeNull();
    expect(tree.queryByLabelText('Wax')).toBeNull();
    expect(tree.queryByLabelText('Test')).toBeNull();
  });

  it('wax-truck mode shows the tests + profile tabs', () => {
    mockMode = {mode: 'waxtruck', setMode: jest.fn(), isCoach: true};
    const tree = renderTabBar();
    expect(tree.getByLabelText('Tests')).toBeTruthy();
    expect(tree.getByLabelText('Profile')).toBeTruthy();
    expect(tree.queryByLabelText('Athletes')).toBeNull();
    expect(tree.queryByLabelText('Ski')).toBeNull();
  });

  it('shows all three mode segments only for coaches', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: true};
    const coachTree = renderTabBar();
    expect(coachTree.getByLabelText('My Fleet mode')).toBeTruthy();
    expect(coachTree.getByLabelText('Coaching mode')).toBeTruthy();
    expect(coachTree.getByLabelText('Wax Truck mode')).toBeTruthy();
  });

  it('hides the switcher for non-coaches', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
    const tree = renderTabBar();
    expect(tree.queryByLabelText('My Fleet mode')).toBeNull();
    expect(tree.queryByLabelText('Coaching mode')).toBeNull();
    expect(tree.queryByLabelText('Wax Truck mode')).toBeNull();
  });
});

describe('TabBar — mode switch wiring (issue #14)', () => {
  it('tapping Coaching switches mode and navigates to the coaching home', () => {
    const setMode = jest.fn();
    mockMode = {mode: 'personal', setMode, isCoach: true};
    const tree = renderTabBar();

    fireEvent.press(tree.getByLabelText('Coaching mode'));

    expect(setMode).toHaveBeenCalledWith('coaching');
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'CoachDashboard'}],
    });
  });

  it('tapping Wax Truck switches mode and navigates to the wax-truck home', () => {
    const setMode = jest.fn();
    mockMode = {mode: 'personal', setMode, isCoach: true};
    const tree = renderTabBar();

    fireEvent.press(tree.getByLabelText('Wax Truck mode'));

    expect(setMode).toHaveBeenCalledWith('waxtruck');
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'WaxTruck'}],
    });
  });

  it('tapping the already-active segment is a no-op (no nav, no setMode)', () => {
    const setMode = jest.fn();
    mockMode = {mode: 'coaching', setMode, isCoach: true};
    const tree = renderTabBar();

    fireEvent.press(tree.getByLabelText('Coaching mode'));

    expect(setMode).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });
});
