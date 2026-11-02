import {
  PROVISION_TIMEOUT_MS,
  ProvisionDeviceUseCase,
  validateWifiCredentials,
} from '@/features/device/domain/usecases/ProvisionDeviceUseCase';
import {IDeviceRepository} from '@/features/device/domain/repositories/IDeviceRepository';

describe('ProvisionDeviceUseCase', () => {
  let mockRepo: jest.Mocked<IDeviceRepository>;
  let useCase: ProvisionDeviceUseCase;
  const credentials = {ssid: 'Office', password: 'secret123'};

  beforeEach(() => {
    mockRepo = {
      scanDevices: jest.fn(),
      scanWifi: jest.fn(),
      getSavedWifiSsid: jest.fn(),
      saveWifiSsid: jest.fn().mockResolvedValue(undefined),
      provision: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ProvisionDeviceUseCase(mockRepo);
  });

  afterEach(() => jest.useRealTimers());

  it('validates SSID and WPA password length', () => {
    expect(validateWifiCredentials({ssid: ' ', password: ''}, false)).toBe(
      'Vui lòng chọn mạng Wi-Fi',
    );
    expect(
      validateWifiCredentials({ssid: 'A', password: '1234567'}, true),
    ).toBe('Mật khẩu Wi-Fi phải từ 8 đến 63 ký tự');
    expect(
      validateWifiCredentials({ssid: 'A', password: 'x'.repeat(64)}, true),
    ).not.toBeNull();
    expect(
      validateWifiCredentials({ssid: 'A', password: ''}, false),
    ).toBeNull();
    expect(
      validateWifiCredentials({ssid: 'A', password: '12345678'}, true),
    ).toBeNull();
  });

  it('rejects invalid credentials without touching the device', async () => {
    await expect(
      useCase.execute({
        deviceId: 'd1',
        credentials: {ssid: 'A', password: '1'},
        secured: true,
        rememberWifi: true,
      }),
    ).rejects.toThrow('Mật khẩu Wi-Fi phải từ 8 đến 63 ký tự');
    expect(mockRepo.provision).not.toHaveBeenCalled();
  });

  it('remembers only the SSID, then provisions', async () => {
    await useCase.execute({
      deviceId: 'd1',
      credentials,
      secured: true,
      rememberWifi: true,
    });
    expect(mockRepo.saveWifiSsid).toHaveBeenCalledWith('Office');
    expect(mockRepo.provision).toHaveBeenCalledWith('d1', credentials);
  });

  it('clears the saved SSID when remember is off', async () => {
    await useCase.execute({
      deviceId: 'd1',
      credentials,
      secured: true,
      rememberWifi: false,
    });
    expect(mockRepo.saveWifiSsid).toHaveBeenCalledWith(null);
  });

  it('fails when the device never answers', async () => {
    jest.useFakeTimers();
    mockRepo.provision.mockReturnValue(new Promise(() => {}));
    const pending = useCase.execute({
      deviceId: 'd1',
      credentials,
      secured: true,
      rememberWifi: false,
    });
    const outcome = pending.catch((e: Error) => e.message);
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(PROVISION_TIMEOUT_MS);
    expect(await outcome).toBe('Thiết bị không phản hồi, vui lòng thử lại');
  });
});
