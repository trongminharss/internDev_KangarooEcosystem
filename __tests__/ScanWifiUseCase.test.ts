import {ScanWifiUseCase} from '@/features/device/domain/usecases/ScanWifiUseCase';
import {IDeviceRepository} from '@/features/device/domain/repositories/IDeviceRepository';

describe('ScanWifiUseCase', () => {
  const build = (savedSsid: string | null) =>
    new ScanWifiUseCase({
      scanDevices: jest.fn(),
      scanWifi: jest.fn().mockResolvedValue([
        {ssid: 'Home', signal: -80, secured: true},
        {ssid: 'Office', signal: -45, secured: true},
        {ssid: 'Home', signal: -55, secured: true},
        {ssid: '  ', signal: -30, secured: false},
        {ssid: 'Guest', signal: -60, secured: false},
      ]),
      getSavedWifiSsid: jest.fn().mockResolvedValue(savedSsid),
      saveWifiSsid: jest.fn(),
      provision: jest.fn(),
    } as jest.Mocked<IDeviceRepository>);

  it('dedupes by SSID keeping the strongest, drops blanks, sorts by signal', async () => {
    const {networks} = await build(null).execute();
    expect(networks.map(n => [n.ssid, n.signal])).toEqual([
      ['Office', -45],
      ['Home', -55],
      ['Guest', -60],
    ]);
  });

  it('puts the saved network first', async () => {
    const {networks, savedSsid} = await build('Guest').execute();
    expect(savedSsid).toBe('Guest');
    expect(networks[0].ssid).toBe('Guest');
  });
});
