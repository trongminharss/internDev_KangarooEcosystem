import {IDeviceRepository} from '../repositories/IDeviceRepository';
import {WifiNetwork} from '../entities/Device';

export interface ScanWifiResult {
  networks: WifiNetwork[];
  savedSsid: string | null;
}

export class ScanWifiUseCase {
  constructor(private deviceRepo: IDeviceRepository) {}

  /** Networks strongest-first, deduped by SSID, with the saved one on top. */
  async execute(): Promise<ScanWifiResult> {
    const [raw, savedSsid] = await Promise.all([
      this.deviceRepo.scanWifi(),
      this.deviceRepo.getSavedWifiSsid(),
    ]);
    const bySsid = new Map<string, WifiNetwork>();
    raw
      .filter(n => n.ssid.trim().length > 0)
      .forEach(n => {
        const prev = bySsid.get(n.ssid);
        if (!prev || n.signal > prev.signal) {
          bySsid.set(n.ssid, n);
        }
      });
    const networks = [...bySsid.values()].sort(
      (a, b) =>
        Number(b.ssid === savedSsid) - Number(a.ssid === savedSsid) ||
        b.signal - a.signal,
    );
    return {networks, savedSsid};
  }
}
