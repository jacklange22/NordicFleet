import React, {useEffect, useState} from 'react';
import {View, Pressable, Text, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, typography} from '../../theme';
import {useAuth} from '../../context/AuthContext';
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

/**
 * Bottom tab bar with six entries for athletes (incl. Messages), two
 * for coaches.
 *
 * Props:
 *   role     'athlete' | 'coach'
 */

const ATHLETE_TABS = [
  {key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: 'Home'},
  {key: 'add', label: 'Add', icon: 'add-circle-outline', activeIcon: 'add-circle', route: 'newSki'},
  {key: 'wax', label: 'Wax', icon: 'flask-outline', activeIcon: 'flask', route: 'WaxLog'},
  {key: 'test', label: 'Test', icon: 'analytics-outline', activeIcon: 'analytics', route: 'TestingLog'},
  {key: 'messages', label: 'Messages', icon: 'chatbubble-outline', activeIcon: 'chatbubble', route: 'Messages', badgeKey: 'unread'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

const COACH_TABS = [
  {key: 'dashboard', label: 'Athletes', icon: 'people-outline', activeIcon: 'people', route: 'CoachDashboard'},
  {key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: 'Profile'},
];

const TabBar = ({role = 'athlete'}) => {
  const insets = useSafeAreaInsets();
  const navigation = useSafeNavigation();
  const route = useSafeRoute();
  const {user} = useAuth() || {};
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (role !== 'athlete' || !user?.uid) {
      setUnread(0);
      return;
    }
    return subscribeUnreadCountForAthlete(user.uid, setUnread);
  }, [user?.uid, role]);

  const tabs = role === 'coach' ? COACH_TABS : ATHLETE_TABS;

  return (
    <View
      style={[
        styles.container,
        {paddingBottom: Math.max(insets.bottom, spacing.sm)},
      ]}>
      {tabs.map(tab => {
        const active = route?.name === tab.route;
        const iconName = active ? tab.activeIcon : tab.icon;
        const color = active ? colors.red : colors.textTertiary;
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
                <View style={styles.badge}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
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
    backgroundColor: colors.red,
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
