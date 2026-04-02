import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import HabitsScreen from '../screens/HabitsScreen';
import FocusScreen from '../screens/FocusScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';

import HomeIcon from '../../assets/images/tabIcons/home.svg';
import HabitsIcon from '../../assets/images/tabIcons/habits.svg';
import FocusIcon from '../../assets/images/tabIcons/focus.svg';
import CalendarIcon from '../../assets/images/tabIcons/calendar.svg';
import ProfileIcon from '../../assets/images/tabIcons/profile.svg';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#F83603';
const DEFAULT_COLOR = '#000000';

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 80,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 2,

          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <HomeIcon
              width={26}
              height={26}
              color={focused ? ACTIVE_COLOR : DEFAULT_COLOR}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Habits"
        component={HabitsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <HabitsIcon
              width={26}
              height={26}
              color={focused ? ACTIVE_COLOR : DEFAULT_COLOR}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Focus"
        component={FocusScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <FocusIcon
              width={26}
              height={26}
              color={focused ? ACTIVE_COLOR : DEFAULT_COLOR}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <CalendarIcon
              width={26}
              height={26}
              color={focused ? ACTIVE_COLOR : DEFAULT_COLOR}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <ProfileIcon
              width={26}
              height={26}
              color={focused ? ACTIVE_COLOR : DEFAULT_COLOR}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}