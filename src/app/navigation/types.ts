import {NavigatorScreenParams, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import type {DiscoveredDevice, WifiSelection} from '@/features/device';

export type RootStackParamList = {
  Splash: undefined;
  BottomNavigation: NavigatorScreenParams<BottomTabParamList> | undefined;
  Onboarding: undefined;
  PhoneLogin: undefined;
  Otp: {phoneNumber: string};
  Home: undefined;
  Account: undefined;
  AddDevice: undefined;
  DeviceReset: {modelId: string};
  WifiSetup: {modelId: string; device?: DiscoveredDevice};
  DeviceSearch: {modelId: string; wifi: WifiSelection};
  DeviceConnect: {device: DiscoveredDevice; wifi: WifiSelection};
  PurifierDetail: undefined;
  FilterReplace: {filterIds: string[]};
  Warranty: undefined;
  DeviceFeedback: {snapshot: [string, string][]};
  WaterMode: {channel?: 'hot' | 'cold'} | undefined;
  SimpleAddDevice: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Automation: undefined;
  Service: {topic?: 'maintenance' | 'chat'} | undefined;
  Store: {skus?: string[]} | undefined;
};

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type BottomTabNavProp = BottomTabNavigationProp<BottomTabParamList>;

export const useAppNavigation = () => useNavigation<RootNavigationProp>();
