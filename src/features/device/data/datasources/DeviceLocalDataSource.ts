import {Storage} from '@/core/utils/storage';

export class DeviceLocalDataSource {
  getSavedWifiSsid(): Promise<string | null> {
    return Storage.getItem<string>(Storage.KEY_SAVED_WIFI_SSID);
  }

  async saveWifiSsid(ssid: string | null): Promise<void> {
    if (ssid) {
      await Storage.setItem(Storage.KEY_SAVED_WIFI_SSID, ssid);
    } else {
      await Storage.removeItem(Storage.KEY_SAVED_WIFI_SSID);
    }
  }
}
