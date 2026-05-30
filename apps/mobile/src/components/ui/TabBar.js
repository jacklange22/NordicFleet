import React, {useEffect, useRef, useState} from 'react';
import {View, Pressable, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, typography} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useMode} from '../../context/ModeContext';
import {subscribeUnreadCountForAthlete} from '../../services/messageService';
import {trace} from '../../services/devTrace';

// Both useNavigation and useRoute throw when the component isn't inside a
// NavigationContainer / Screen. Tests sometimes render screens standalone,
// so wrap defensively - TabBar should degrade rather than crash.
const useSafeNavigation = () => {
  try {
    return useNavigation();
  } catch {
    return null;
  }
};
const useSafeRoute = () => {
  try {
    return useRoute();
  } catch {
    return null;
  }
};
const useSafeMode = () => {
  try {
    return useMode();
  } catch {
    return {mode: 'personal', setMode: () => {}, isCoach: false};
  }
};

// Personal mode: the full skier experience.
const PERSONAL_TABS = [
  {key: 'home', label: 'Fleet', icon: 'home-outline', activeIcon: 'home', route: 'Home'},
  {key: 'add', label: 'Ski', icon: 'add-circle-outline', activeIcon: 'add-circle', route: 'newSki'},
  {key: 'wax', label: 'Wax', icon: 'flask-outline', activeIcon: 'flask', route: 'WaxLog'},
  {key: 'test', label: 'Test', icon: 'analytics-outline', activeIcon: 'analytics', route: 'TestingLog'},
  {key: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: 'Messages', badgeKey: 'unread'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

// Coaching mode: managing other skiers. The Athletes dashboard
// surfaces pending requests inline, so there's no separate Requests
// tab on iOS (documented in NOTES.md). Add / Wax / Test are hidden -
// you don't log your own equipment in coaching mode.
const COACHING_TABS = [
  {key: 'dashboard', label: 'Athletes', icon: 'people-outline', activeIcon: 'people', route: 'CoachDashboard'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

// Wax Truck mode: head-to-head wax testing. Tests list + profile -
// you don't manage athletes or your own fleet from here.
const WAXTRUCK_TABS = [
  {key: 'tests', label: 'Tests', icon: 'git-network-outline', activeIcon: 'git-network', route: 'WaxTruck'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

// Home route for each mode - used when the toggle switches contexts.
const MODE_HOME = {
  personal: 'Home',
  coaching: 'CoachDashboard',
  waxtruck: 'WaxTruck',
};

const MODE_ACCENT = {
  personal: colors.red,
  coaching: colors.coaching,
  waxtruck: colors.waxtruck,
};

const MODE_TABS = {
  personal: PERSONAL_TABS,
  coaching: COACHING_TABS,
  waxtruck: WAXTRUCK_TABS,
};

const TabBar = () => {
  const insets = useSafeAreaInsets();
  const navigation = useSafeNavigation();
  const route = useSafeRoute();
  const {user} = useAuth() || {};
  const {mode, setMode, isCoach} = useSafeMode();
  const [unread, setUnread] = useState(0);
  // Re-entrancy guard: a fast double-tap on the switcher (e.g. Coaching then
  // Wax Truck) must not queue two stack resets. Set true on the first valid
  // switch, released after the deferred navigation runs (or on unmount, when
  // the reset tears this TabBar down).
  const switchingRef = useRef(false);

  useEffect(() => {
    if (mode !== 'personal' || !user?.uid) {
      setUnread(0);
      return undefined;
    }
    return subscribeUnreadCountForAthlete(user.uid, setUnread);
  }, [user?.uid, mode]);

  const accent = MODE_ACCENT[mode] || colors.red;
  const tabs = MODE_TABS[mode] || PERSONAL_TABS;

  const switchMode = next => {
    // No-op when already in this mode, or while a switch is already in flight.
    if (next === mode || switchingRef.current) {
      return;
    }
    switchingRef.current = true;
    trace('mode switch requested', {from: mode, to: next});

    // 1) Persist + update the mode first (so the restored-mode + the screen
    //    we reset to agree).
    setMode(next);
    trace('mode persisted', {mode: next});

    // 2) Defer the stack reset OUT of this touch/setState frame.
    //    Previously this ran synchronously here, right after a native
    //    layout-animation config call - and on a real device the Fabric
    //    layout-animation driver tried to animate the whole stack teardown +
    //    remount, aborting the mounting transaction on the main thread
    //    (mounting pullTransaction -> SIGABRT). The layout animation is gone
    //    now, and running reset() on the next frame lets the current frame's
    //    mutations settle before the big remount.
    const target = MODE_HOME[next];
    requestAnimationFrame(() => {
      if (navigation) {
        // A mode switch is a top-level context change, so RESET the stack to
        // the new mode's home (clean single-screen stack - no stale screens
        // underneath, no back button that crosses modes).
        trace('mode navigation start', {to: target});
        navigation.reset({index: 0, routes: [{name: target}]});
        trace('mode navigation complete', {to: target});
      }
      switchingRef.current = false;
    });
  };

  return (
    <View
      style={[
        styles.container,
        {paddingBottom: Math.max(insets.bottom, spacing.sm)},
        // A hairline of the active mode's accent on top so the mode reads
        // at a glance even before looking at the segmented control.
        mode !== 'personal' && {borderTopColor: accent},
      ]}>
      {/* Mode switcher - only for users with the coaching capability. */}
      {isCoach && (
        <View style={styles.switcherWrap}>
          <View style={styles.switcher}>
            <ModeSegment
              label="My Fleet"
              active={mode === 'personal'}
              accent={colors.red}
              onPress={() => switchMode('personal')}
            />
            <ModeSegment
              label="Coaching"
              active={mode === 'coaching'}
              accent={colors.coaching}
              onPress={() => switchMode('coaching')}
            />
            <ModeSegment
              label="Wax Truck"
              active={mode === 'waxtruck'}
              accent={colors.waxtruck}
              onPress={() => switchMode('waxtruck')}
            />
          </View>
        </View>
      )}

      <View style={styles.tabRow}>
        {tabs.map(tab => {
          const active = route?.name === tab.route;
          const iconName = active ? tab.activeIcon : tab.icon;
          const color = active ? accent : colors.textTertiary;
          const badgeCount = tab.badgeKey === 'unread' ? unread : 0;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{selected: active}}
              onPress={() => {
                if (!active && navigation) {
                  navigation.navigate(tab.route);
                }
              }}
              style={({pressed}) => [styles.tab, pressed && {opacity: 0.7}]}>
              <View>
                <Ionicons name={iconName} size={24} color={color} />
                {badgeCount > 0 && (
                  <View style={[styles.badge, {backgroundColor: accent}]}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, {color}]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const ModeSegment = ({label, active, accent, onPress}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={`${label} mode`}
    accessibilityState={{selected: active}}
    onPress={onPress}
    style={[
      styles.segment,
      active && {backgroundColor: accent},
    ]}>
    <Text
      style={[
        styles.segmentText,
        {color: active ? colors.textPrimary : colors.textSecondary},
      ]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  switcherWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  switcher: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  segmentText: {
    ...typography.bodySm,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabRow: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.bodySm,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default TabBar;
