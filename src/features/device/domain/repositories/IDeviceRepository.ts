import {
  DiscoveredDevice,
  WifiCredentials,
  WifiNetwork,
} from '../entities/Device';

export interface IDeviceRepository {
  /** Starts a BLE scan; `onFound` fires once per new device. Returns a stop function. */
  scanDevices(onFound: (device: DiscoveredDevice) => void): () => void;
  scanWifi(): Promise<WifiNetwork[]>;
  getSavedWifiSsid(): Promise<string | null>;
  saveWifiSsid(ssid: string | null): Promise<void>;
  /** Sends Wi-Fi credentials to the device over BLE and waits until it joins the network. */
  provision(deviceId: string, credentials: WifiCredentials): Promise<void>;
}
