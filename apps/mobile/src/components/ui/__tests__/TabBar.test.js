import React from 'react';
import {render, fireEvent, act} from '@testing-library/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';

// switchMode defers navigation.reset to requestAnimationFrame (so the stack
// teardown happens off the touch frame — the device LayoutAnimation crash
// fix). Capture rAF callbacks so tests can flush them deterministically and
// also prove the re-entrancy guard holds while a switch is in flight.
let rafQueue = [];
const flushRAF = () =>
  act(() => {
    const q = rafQueue;
    rafQueue = [];
    q.forEach(cb => cb());
  });

const SAFE_METRICS = {
  frame: {x: 0, y: 0, width: 390, height: 844},
  insets: {top: 47, left: 0, right: 0, bottom: 34},
};

let mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
let mockRoute = {name: 'Home'};
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
  useRoute: () => mockRoute,
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
  mockRoute = {name: 'Home'};
  mockNavigate.mockClear();
  mockReset.mockClear();
  rafQueue = [];
  global.requestAnimationFrame = cb => {
    rafQueue.push(cb);
    return rafQueue.length;
  };
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

describe('TabBar — central visibility policy (navTabs)', () => {
  it('renders nothing on a hidden route (e.g. the WaxLog entry form)', () => {
    mockRoute = {name: 'WaxLog'};
    const tree = renderTabBar();
    expect(tree.queryByLabelText('Fleet')).toBeNull();
    expect(tree.queryByLabelText('Profile')).toBeNull();
  });

  it('renders nothing on auth routes', () => {
    mockRoute = {name: 'Login'};
    const tree = renderTabBar();
    expect(tree.queryByLabelText('Fleet')).toBeNull();
  });

  it('still renders on a visible edit route (EditWaxLog)', () => {
    mockRoute = {name: 'EditWaxLog'};
    const tree = renderTabBar();
    expect(tree.getByLabelText('Fleet')).toBeTruthy();
    expect(tree.getByLabelText('Profile')).toBeTruthy();
  });
});

describe('TabBar — mode switch wiring (issue #14 / device crash fix)', () => {
  // mode → home route map, exercised as the full cycle the user reported
  // crashing on a real device.
  const transitions = [
    {from: 'personal', segment: 'Coaching mode', to: 'coaching', route: 'CoachDashboard'},
    {from: 'coaching', segment: 'Wax Truck mode', to: 'waxtruck', route: 'WaxTruck'},
    {from: 'waxtruck', segment: 'My Fleet mode', to: 'personal', route: 'Home'},
  ];

  transitions.forEach(({from, segment, to, route}) => {
    it(`${from} → ${to} persists the mode and resets to ${route}`, () => {
      const setMode = jest.fn();
      mockMode = {mode: from, setMode, isCoach: true};
      const tree = renderTabBar();

      fireEvent.press(tree.getByLabelText(segment));

      // Mode is persisted synchronously…
      expect(setMode).toHaveBeenCalledWith(to);
      // …but the stack reset is deferred off the touch frame (the crash fix).
      expect(mockReset).not.toHaveBeenCalled();

      flushRAF();
      expect(mockReset).toHaveBeenCalledTimes(1);
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{name: route}],
      });
    });
  });

  it('does NOT use LayoutAnimation (the device SIGABRT cause)', () => {
    // Regression guard: the TabBar source must not reintroduce a layout
    // animation around the mode switch / stack reset.
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../TabBar.js'),
      'utf8',
    );
    expect(src).not.toMatch(/LayoutAnimation/);
    expect(src).not.toMatch(/configureNext/);
  });

  it('a rapid double-tap triggers only ONE switch (re-entrancy guard)', () => {
    const setMode = jest.fn();
    mockMode = {mode: 'personal', setMode, isCoach: true};
    const tree = renderTabBar();

    // Two fast taps before the deferred reset runs.
    fireEvent.press(tree.getByLabelText('Coaching mode'));
    fireEvent.press(tree.getByLabelText('Wax Truck mode'));

    // Only the first switch is accepted; the second is guarded out.
    expect(setMode).toHaveBeenCalledTimes(1);
    expect(setMode).toHaveBeenCalledWith('coaching');

    flushRAF();
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith({
      index: 0,
      routes: [{name: 'CoachDashboard'}],
    });
  });

  it('tapping the already-active segment is a no-op (no nav, no setMode)', () => {
    const setMode = jest.fn();
    mockMode = {mode: 'coaching', setMode, isCoach: true};
    const tree = renderTabBar();

    fireEvent.press(tree.getByLabelText('Coaching mode'));
    flushRAF();

    expect(setMode).not.toHaveBeenCalled();
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('non-coach has no coach/waxtruck segments to switch into', () => {
    mockMode = {mode: 'personal', setMode: jest.fn(), isCoach: false};
    const tree = renderTabBar();
    // The switcher is not rendered at all for non-coaches, so coaching /
    // wax-truck are unreachable from the tab bar.
    expect(tree.queryByLabelText('Coaching mode')).toBeNull();
    expect(tree.queryByLabelText('Wax Truck mode')).toBeNull();
  });
});
