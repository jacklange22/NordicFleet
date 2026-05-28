import React, {useEffect, useState} from 'react';
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, typography} from '../../theme';
import {useAuth} from '../../context/AuthContext';
import {useMode} from '../../context/ModeContext';
import {subscribeUnreadCountForAthlete} from '../../services/messageService';

// Both useNavigation and useRoute throw when the component isn't inside a
// NavigationContainer / Screen. Tests sometimes render screens standalone,
// so wrap defensively — TabBar should degrade rather than crash.
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

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Personal mode: the full skier experience.
const PERSONAL_TABS = [
  {key: 'home', label: 'Fleet', icon: 'home-outline', activeIcon: 'home', route: 'Home'},
  {key: 'add', label: 'Add', icon: 'add-circle-outline', activeIcon: 'add-circle', route: 'newSki'},
  {key: 'wax', label: 'Wax', icon: 'flask-outline', activeIcon: 'flask', route: 'WaxLog'},
  {key: 'test', label: 'Test', icon: 'analytics-outline', activeIcon: 'analytics', route: 'TestingLog'},
  {key: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: 'Messages', badgeKey: 'unread'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

// Coaching mode: managing other skiers. The Athletes dashboard
// surfaces pending requests inline, so there's no separate Requests
// tab on iOS (documented in NOTES.md). Add / Wax / Test are hidden —
// you don't log your own equipment in coaching mode.
const COACHING_TABS = [
  {key: 'dashboard', label: 'Athletes', icon: 'people-outline', activeIcon: 'people', route: 'CoachDashboard'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

// Home route for each mode — used when the toggle switches contexts.
const MODE_HOME = {personal: 'Home', coaching: 'CoachDashboard'};

const TabBar = () => {
  const insets = useSafeAreaInsets();
  const navigation = useSafeNavigation();
  const route = useSafeRoute();
  const {user} = useAuth() || {};
  const {mode, setMode, isCoach} = useSafeMode();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (mode !== 'personal' || !user?.uid) {
      setUnread(0);
      return undefined;
    }
    return subscribeUnreadCountForAthlete(user.uid, setUnread);
  }, [user?.uid, mode]);

  const accent = mode === 'coaching' ? colors.coaching : colors.red;
  const tabs = mode === 'coaching' ? COACHING_TABS : PERSONAL_TABS;

  const switchMode = next => {
    if (next === mode) {
      return;
    }
    LayoutAnimation.configureNext(
      LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'),
    );
    setMode(next);
    if (navigation) {
      // Reframe to the destination mode's home so the user isn't left
      // on a screen that doesn't belong to the new mode.
      navigation.navigate(MODE_HOME[next]);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {paddingBottom: Math.max(insets.bottom, spacing.sm)},
        mode === 'coaching' && styles.containerCoaching,
      ]}>
      {/* Mode switcher — only for users with the coaching capability. */}
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
  containerCoaching: {
    // A hairline of the coaching accent on top so the mode reads at a
    // glance even before you look at the segmented control.
    borderTopColor: colors.coaching,
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
