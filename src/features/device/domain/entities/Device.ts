export type DeviceCategory = 'water' | 'air' | 'electric';

/** A model the app knows how to pair (the "Thêm thủ công" catalog). */
export interface DeviceModel {
  id: string;
  name: string;
  category: DeviceCategory;
  /** Prefix the device advertises over BLE, e.g. `KG-WP-7F3A`. */
  blePrefix: string;
}

/** A device found by a BLE scan, already matched to a catalog model. */
export interface DiscoveredDevice {
  id: string;
  name: string;
  modelId: string;
  /** dBm, closer to 0 = stronger. */
  rssi: number;
}

export interface WifiNetwork {
  ssid: string;
  /** dBm, closer to 0 = stronger. */
  signal: number;
  secured: boolean;
}

export interface WifiCredentials {
  ssid: string;
  password: string;
}

/** What the Wi-Fi step hands to the connect step. */
export interface WifiSelection {
  credentials: WifiCredentials;
  secured: boolean;
  /** Remember the SSID (never the password) for the next pairing. */
  rememberWifi: boolean;
}

export type SignalLevel = 'strong' | 'medium' | 'weak';

export const signalLevel = (dbm: number): SignalLevel =>
  dbm >= -60 ? 'strong' : dbm >= -75 ? 'medium' : 'weak';

// ponytail: static catalog in the app bundle — move behind an API endpoint once
// the backend publishes the supported-model list.
export const DEVICE_CATALOG: readonly DeviceModel[] = [
  {
    id: 'water-purifier',
    name: 'Máy lọc nước',
    category: 'water',
    blePrefix: 'KG-WP',
  },
  {
    id: 'air-purifier',
    name: 'Máy lọc không khí',
    category: 'air',
    blePrefix: 'KG-AP',
  },
  {
    id: 'smart-socket',
    name: 'Ổ cắm thông minh',
    category: 'electric',
    blePrefix: 'KG-SK',
  },
  {
    id: 'smart-switch',
    name: 'Công tắc thông minh',
    category: 'electric',
    blePrefix: 'KG-SW',
  },
];

export const findDeviceModel = (modelId: string): DeviceModel | undefined =>
  DEVICE_CATALOG.find(m => m.id === modelId);
