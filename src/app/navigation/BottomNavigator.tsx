import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useTranslation} from 'react-i18next';

import {useTheme} from '@/core/theme';
import {HomeScreen} from '@/features/home';
import {AutomationScreen} from '@/features/automation';
import {ServiceScreen} from '@/features/service';
import {StoreScreen} from '@/features/store';

import {AnimatedBottomBar} from './components/AnimatedBottomBar';

import HomeSvg from '@/assets/svg/navigation/home.svg';
import AutomationSvg from '@/assets/svg/navigation/automation.svg';
import ServiceSvg from '@/assets/svg/navigation/service.svg';
import StoreSvg from '@/assets/svg/navigation/store.svg';

import {BottomTabParamList} from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const ICON_SIZE = 26;

// Module-level render prop — tránh react/no-unstable-nested-components.
const renderTabBar = (props: BottomTabBarProps) => (
  <AnimatedBottomBar {...props} />
);

export const BottomNavigator: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.tabBar.iconActive,
        tabBarInactiveTintColor: colors.tabBar.iconInactive,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.home'),
          tabBarIcon: ({color}) => (
            <HomeSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Automation"
        component={AutomationScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.automation'),
          tabBarIcon: ({color}) => (
            <AutomationSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Service"
        component={ServiceScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.service'),
          tabBarIcon: ({color}) => (
            <ServiceSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarAccessibilityLabel: t('tab.store'),
          tabBarIcon: ({color}) => (
            <StoreSvg width={ICON_SIZE} height={ICON_SIZE} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigator;
