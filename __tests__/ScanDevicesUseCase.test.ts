import {ScanDevicesUseCase} from '@/features/device/domain/usecases/ScanDevicesUseCase';
import {IDeviceRepository} from '@/features/device/domain/repositories/IDeviceRepository';
import {DiscoveredDevice} from '@/features/device/domain/entities/Device';

const wp: DiscoveredDevice = {
  id: '1',
  name: 'Máy lọc nước 7F3A',
  modelId: 'water-purifier',
  rssi: -50,
};
const sk: DiscoveredDevice = {
  id: '2',
  name: 'Ổ cắm thông minh B204',
  modelId: 'smart-socket',
  rssi: -70,
};

describe('ScanDevicesUseCase', () => {
  let mockRepo: jest.Mocked<IDeviceRepository>;
  const stop = jest.fn();

  beforeEach(() => {
    mockRepo = {
      scanDevices: jest.fn(onFound => {
        onFound(wp);
        onFound(sk);
        return stop;
      }),
      scanWifi: jest.fn(),
      getSavedWifiSsid: jest.fn(),
      saveWifiSsid: jest.fn(),
      provision: jest.fn(),
    };
  });

  it('reports every device and returns the stop function', () => {
    const found: DiscoveredDevice[] = [];
    const result = new ScanDevicesUseCase(mockRepo).execute(d => found.push(d));
    expect(found).toEqual([wp, sk]);
    expect(result).toBe(stop);
  });

  it('filters by model in the manual flow', () => {
    const found: DiscoveredDevice[] = [];
    new ScanDevicesUseCase(mockRepo).execute(
      d => found.push(d),
      'smart-socket',
    );
    expect(found).toEqual([sk]);
  });
});
