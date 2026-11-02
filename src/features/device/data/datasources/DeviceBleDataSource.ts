import {WifiCredentials, WifiNetwork} from '../../domain/entities/Device';
import {BleAdvertisementDTO} from '../models/DeviceDTO';

// ponytail: simulated radio — no BLE / Wi-Fi native module is installed yet.
// Upgrade path: react-native-ble-plx for scanDevices, the firmware's BLE provisioning
// protocol (e.g. ESP BLE Prov) for provision, and a device-side Wi-Fi scan for
// scanWifi (iOS cannot list nearby SSIDs itself). Keep the method shapes.
const FAKE_ADVERTISEMENTS: BleAdvertisementDTO[] = [
  {id: 'AA:01:7F:3A', name: 'KG-WP-7F3A', rssi: -48},
  {id: 'AA:02:19C2', name: 'Mi Band 7', rssi: -60},
  {id: 'AA:03:B204', name: 'KG-SK-B204', rssi: -67},
  {id: 'AA:04:5E11', name: 'KG-AP-5E11', rssi: -74},
];

const FAKE_WIFI: WifiNetwork[] = [
  {ssid: 'Kangaroo_Office', signal: -45, secured: true},
  {ssid: 'Nha Minh 5G', signal: -58, secured: true},
  {ssid: 'Kangaroo_Guest', signal: -66, secured: false},
  {ssid: 'Nha Minh 5G', signal: -80, secured: true},
  {ssid: 'TP-LINK_2F90', signal: -79, secured: true},
];

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DeviceBleDataSource {
  scan(onAdvertisement: (dto: BleAdvertisementDTO) => void): () => void {
    const timers = FAKE_ADVERTISEMENTS.map((dto, i) =>
      setTimeout(() => onAdvertisement(dto), 2500 + i * 2000),
    );
    return () => timers.forEach(clearTimeout);
  }

  async scanWifi(): Promise<WifiNetwork[]> {
    await wait(1200);
    return FAKE_WIFI;
  }

  async provision(
    _deviceId: string,
    _credentials: WifiCredentials,
  ): Promise<void> {
    await wait(6000);
  }
}
