import {IDeviceRepository} from '../repositories/IDeviceRepository';
import {WifiCredentials, WifiSelection} from '../entities/Device';

export type ProvisionDeviceParams = WifiSelection & {deviceId: string};

// ponytail: fixed 90s budget for BLE handshake + Wi-Fi join; tune once real firmware timings are measured
export const PROVISION_TIMEOUT_MS = 90_000;

/** Returns an error message, or null when the credentials are usable. */
export const validateWifiCredentials = (
  {ssid, password}: WifiCredentials,
  secured: boolean,
): string | null => {
  if (!ssid.trim()) {
    return 'Vui lòng chọn mạng Wi-Fi';
  }
  // WPA/WPA2 passphrases are 8–63 chars
  if (secured && (password.length < 8 || password.length > 63)) {
    return 'Mật khẩu Wi-Fi phải từ 8 đến 63 ký tự';
  }
  return null;
};

export class ProvisionDeviceUseCase {
  constructor(private deviceRepo: IDeviceRepository) {}

  async execute({
    deviceId,
    credentials,
    secured,
    rememberWifi,
  }: ProvisionDeviceParams): Promise<void> {
    const invalid = validateWifiCredentials(credentials, secured);
    if (invalid) {
      throw new Error(invalid);
    }
    await this.deviceRepo.saveWifiSsid(rememberWifi ? credentials.ssid : null);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Thiết bị không phản hồi, vui lòng thử lại')),
        PROVISION_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([
        this.deviceRepo.provision(deviceId, credentials),
        timeout,
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
