import {shouldShowTabBar, TABBAR_HIDDEN_ROUTES} from '../navTabs';

describe('navTabs policy', () => {
  it('shows the TabBar on browse / view / detail / edit screens', () => {
    for (const route of [
      'Home',
      'SkiInfo',
      'WaxHistory',
      'TestHistory',
      'EditWaxLog',
      'EditTestLog',
      'Messages',
      'MessageDetail',
      'Profile',
      'Settings',
      'CoachDashboard',
      'AthleteDetail',
      'WaxTruck',
    ]) {
      expect(shouldShowTabBar(route)).toBe(true);
    }
  });

  it('hides the TabBar on auth / scanner / heavy create-entry flows', () => {
    for (const route of [
      'AuthLoading',
      'Welcome',
      'Login',
      'Signup',
      'ForgotPassword',
      'RoleSelect',
      'ScanSki',
      'newSki',
      'WaxLog',
      'TestingLog',
      'ComposeAdvisory',
      'WaxTestSetup',
      'WaxTestRunner',
    ]) {
      expect(shouldShowTabBar(route)).toBe(false);
      expect(TABBAR_HIDDEN_ROUTES.has(route)).toBe(true);
    }
  });

  it('defaults to showing when the route is unknown', () => {
    expect(shouldShowTabBar(undefined)).toBe(true);
    expect(shouldShowTabBar(null)).toBe(true);
    expect(shouldShowTabBar('')).toBe(true);
  });
});
