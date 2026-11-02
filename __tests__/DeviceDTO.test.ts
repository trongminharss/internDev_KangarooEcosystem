import {mapAdvertisementToDevice} from '@/features/device/data/models/DeviceDTO';

describe('mapAdvertisementToDevice', () => {
  it('maps a Kangaroo advertisement to its catalog model', () => {
    expect(
      mapAdvertisementToDevice({id: 'AA', name: 'KG-WP-7F3A', rssi: -48}),
    ).toEqual({
      id: 'AA',
      name: 'Máy lọc nước 7F3A',
      modelId: 'water-purifier',
      rssi: -48,
    });
  });

  it('ignores unnamed and foreign devices', () => {
    expect(
      mapAdvertisementToDevice({id: 'A', name: null, rssi: -40}),
    ).toBeNull();
    expect(
      mapAdvertisementToDevice({id: 'B', name: 'Mi Band 7', rssi: -40}),
    ).toBeNull();
    expect(
      mapAdvertisementToDevice({id: 'C', name: 'KG-WPX', rssi: -40}),
    ).toBeNull();
  });

  it('defaults a missing RSSI to the weakest value', () => {
    expect(
      mapAdvertisementToDevice({id: 'D', name: 'KG-SK-01', rssi: null})?.rssi,
    ).toBe(-100);
  });
});
