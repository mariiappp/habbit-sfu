import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

import HomeIcon from '../../assets/images/tabIcons/home.svg';
import HabitsIcon from '../../assets/images/tabIcons/habits.svg';
import FocusIcon from '../../assets/images/tabIcons/focus.svg';
import CalendarIcon from '../../assets/images/tabIcons/calendar.svg';
import ProfileIcon from '../../assets/images/tabIcons/profile.svg';

const ACTIVE_COLOR = '#F83603';
const DEFAULT_COLOR = '#000000';

export default function BottomNav({ navigation, activeScreen }) {
  const tabs = [
    { key: 'Home', icon: HomeIcon },
    { key: 'Habits', icon: HabitsIcon },
    { key: 'Focus', icon: FocusIcon },
    { key: 'Calendar', icon: CalendarIcon },
    { key: 'Profile', icon: ProfileIcon },
  ];

  const handlePress = (screenName) => {
    if (screenName !== activeScreen) {
      navigation.navigate(screenName);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {tabs.map(({ key, icon: Icon }) => {
          const isActive = activeScreen === key;
          const color = isActive ? ACTIVE_COLOR : DEFAULT_COLOR;

          return (
            <TouchableOpacity
              key={key}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => handlePress(key)}
            >
              <Icon width={26} height={26} color={color} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  container: {
    height: 80,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,

    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});