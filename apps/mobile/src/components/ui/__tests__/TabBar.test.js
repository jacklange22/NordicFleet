import React from 'react';
import {render} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

const SAFE_METRICS = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 47, left: 0, right: 0, bottom: 34},
};

let mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};

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
  useNavigation: () => ({navigate: jest.fn()}),
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
});

describe('TabBar — conditional tabs per mode', () => {
  it('personal mode shows the full skier tab set', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
    const tree = renderTabBar();
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
    expect(tree.getByLabelText('Add')).toBeTruthy();
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
    expect(tree.queryByLabelText('Add')).toBeNull();
    expect(tree.queryByLabelText('Wax')).toBeNull();
    expect(tree.queryByLabelText('Test')).toBeNull();
  });

  it('shows the mode switcher only for coaches', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: true};
    const coachTree = renderTabBar();
    expect(coachTree.getByLabelText('My Fleet mode')).toBeTruthy();
    expect(coachTree.getByLabelText('Coaching mode')).toBeTruthy();
  });

  it('hides the switcher for non-coaches', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
    const tree = renderTabBar();
    expect(tree.queryByLabelText('My Fleet mode')).toBeNull();
    expect(tree.queryByLabelText('Coaching mode')).toBeNull();
  });
});
