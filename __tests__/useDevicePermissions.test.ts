import {androidPermissionsFor} from '@/features/device/presentation/hooks/useDevicePermissions';

describe('androidPermissionsFor', () => {
  it('uses the Android 12+ Bluetooth runtime permissions', () => {
    expect(androidPermissionsFor('bluetooth', 31)).toEqual([
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
    ]);
    expect(androidPermissionsFor('bluetooth', 30)).toEqual([]);
  });

  it('needs NEARBY_WIFI_DEVICES only from Android 13', () => {
    expect(androidPermissionsFor('wifi', 33)).toEqual([
      'android.permission.NEARBY_WIFI_DEVICES',
    ]);
    expect(androidPermissionsFor('wifi', 32)).toEqual([]);
  });

  it('always needs fine location', () => {
    expect(androidPermissionsFor('location', 26)).toEqual([
      'android.permission.ACCESS_FINE_LOCATION',
    ]);
  });
});
