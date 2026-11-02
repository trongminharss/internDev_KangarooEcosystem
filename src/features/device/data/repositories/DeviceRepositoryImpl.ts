import {IDeviceRepository} from '../../domain/repositories/IDeviceRepository';
import {
  DiscoveredDevice,
  WifiCredentials,
  WifiNetwork,
} from '../../domain/entities/Device';
import {DeviceBleDataSource} from '../datasources/DeviceBleDataSource';
import {DeviceLocalDataSource} from '../datasources/DeviceLocalDataSource';
import {mapAdvertisementToDevice} from '../models/DeviceDTO';

export class DeviceRepositoryImpl implements IDeviceRepository {
  constructor(
    private ble: DeviceBleDataSource,
    private local: DeviceLocalDataSource,
  ) {}

  scanDevices(onFound: (device: DiscoveredDevice) => void): () => void {
    // BLE stacks repeat advertisements — report each device once
    const seen = new Set<string>();
    return this.ble.scan(dto => {
      const device = mapAdvertisementToDevice(dto);
      if (device && !seen.has(device.id)) {
        seen.add(device.id);
        onFound(device);
      }
    });
  }

  scanWifi(): Promise<WifiNetwork[]> {
    return this.ble.scanWifi();
  }

  getSavedWifiSsid(): Promise<string | null> {
    return this.local.getSavedWifiSsid();
  }

  saveWifiSsid(ssid: string | null): Promise<void> {
    return this.local.saveWifiSsid(ssid);
  }

  provision(deviceId: string, credentials: WifiCredentials): Promise<void> {
    return this.ble.provision(deviceId, credentials);
  }
}
