import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {SplashScreen} from '@/features/splash';
import {OnboardingScreen} from '@/features/onboarding';
import {HomeScreen} from '@/features/home';
import {AccountScreen} from '@/features/account';
import {OtpScreen, PhoneLoginScreen} from '@/features/auth';
import {
  AddDeviceScreen,
  DeviceConnectScreen,
  DeviceResetScreen,
  DeviceSearchScreen,
  SimpleAddDeviceScreen,
  WifiSetupScreen,
  DeviceFeedbackScreen,
  FilterReplaceScreen,
  PurifierDetailScreen,
  WarrantyScreen,
  WaterModeScreen,
} from '@/features/device';

import {useTheme} from '@/core/theme';
import {BottomNavigator} from './BottomNavigator';
import {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const {theme} = useTheme();

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="BottomNavigation"
          component={BottomNavigator}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="PhoneLogin"
          component={PhoneLoginScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Otp"
          component={OtpScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="AddDevice"
          component={AddDeviceScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="PurifierDetail"
          component={PurifierDetailScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="DeviceReset"
          component={DeviceResetScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="FilterReplace"
          component={FilterReplaceScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="WifiSetup"
          component={WifiSetupScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="Warranty"
          component={WarrantyScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="DeviceSearch"
          component={DeviceSearchScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="WaterMode"
          component={WaterModeScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="DeviceConnect"
          component={DeviceConnectScreen}
          options={{
            headerShown: false,
            animation: 'fade',
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="DeviceFeedback"
          component={DeviceFeedbackScreen}
          options={{
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="SimpleAddDevice"
          component={SimpleAddDeviceScreen}
          options={{
            headerShown: false,
            animation: 'fade',
            // stages swap in place; back is handled by the screen itself
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
