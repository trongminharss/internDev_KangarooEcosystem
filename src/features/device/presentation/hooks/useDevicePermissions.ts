import {useCallback, useEffect, useRef, useState} from 'react';
import {
  AppState,
  Linking,
  Permission,
  PermissionsAndroid,
  Platform,
} from 'react-native';

export type PermissionKey = 'bluetooth' | 'wifi' | 'location';
/** blocked = user chose "don't ask again"; only Settings can re-enable it. */
export type PermissionStatus = 'granted' | 'denied' | 'blocked';
export type PermissionMap = Record<PermissionKey, PermissionStatus>;

export const PERMISSION_KEYS: readonly PermissionKey[] = [
  'bluetooth',
  'wifi',
  'location',
];

const P = PermissionsAndroid.PERMISSIONS;

/** Android runtime permissions behind each key; [] = granted at install time on that API level. */
export const androidPermissionsFor = (
  key: PermissionKey,
  apiLevel: number,
): Permission[] => {
  switch (key) {
    case 'bluetooth':
      return apiLevel >= 31 ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT] : [];
    case 'wifi':
      return apiLevel >= 33 ? [P.NEARBY_WIFI_DEVICES] : [];
    case 'location':
      return [P.ACCESS_FINE_LOCATION];
  }
};

const ALL_GRANTED: PermissionMap = {
  bluetooth: 'granted',
  wifi: 'granted',
  location: 'granted',
};

// ponytail: iOS has no JS permission API without a native module — CoreBluetooth and
// CLLocationManager raise their own prompts on first use (texts in Info.plist).
// Upgrade path: react-native-permissions to check/request them up front.
const isAndroid = Platform.OS === 'android';
const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : 0;

const checkAll = async (prev: PermissionMap | null): Promise<PermissionMap> => {
  const entries = await Promise.all(
    PERMISSION_KEYS.map(async key => {
      const perms = androidPermissionsFor(key, apiLevel);
      const granted = (
        await Promise.all(perms.map(p => PermissionsAndroid.check(p)))
      ).every(Boolean);
      // check() cannot tell "denied" from "blocked" — keep what the last request said
      const status: PermissionStatus = granted
        ? 'granted'
        : prev?.[key] === 'blocked'
        ? 'blocked'
        : 'denied';
      return [key, status] as const;
    }),
  );
  return Object.fromEntries(entries) as PermissionMap;
};

/** Requests the given keys and reports each one's resulting status. */
const requestKeys = async (
  keys: readonly PermissionKey[],
): Promise<Partial<PermissionMap>> => {
  const perms = keys.flatMap(k => androidPermissionsFor(k, apiLevel));
  const results: Partial<Record<Permission, string>> = perms.length
    ? await PermissionsAndroid.requestMultiple(perms)
    : {};
  const result: Partial<PermissionMap> = {};
  keys.forEach(key => {
    const statuses = androidPermissionsFor(key, apiLevel).map(p => results[p]);
    result[key] = statuses.every(s => s === PermissionsAndroid.RESULTS.GRANTED)
      ? 'granted'
      : statuses.includes(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN)
      ? 'blocked'
      : 'denied';
  });
  return result;
};

/** Home asks for Bluetooth early so nearby devices can be shown; safe to call repeatedly. */
export const requestBluetoothPermission = async (): Promise<boolean> => {
  if (!isAndroid) {
    return true;
  }
  const {bluetooth} = await requestKeys(['bluetooth']);
  return bluetooth === 'granted';
};

/** Check-only (never prompts): true when every add-device permission is already granted. */
export const hasAllDevicePermissions = async (): Promise<boolean> => {
  if (!isAndroid) {
    return true;
  }
  const current = await checkAll(null);
  return PERMISSION_KEYS.every(k => current[k] === 'granted');
};

export const useDevicePermissions = () => {
  const [status, setStatus] = useState<PermissionMap | null>(
    isAndroid ? null : ALL_GRANTED,
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  const request = useCallback(async () => {
    if (!isAndroid) {
      return;
    }
    try {
      const current = await checkAll(null);
      const missing = PERMISSION_KEYS.filter(k => current[k] !== 'granted');
      setStatus({...current, ...(await requestKeys(missing))});
    } catch (e) {
      console.error('[useDevicePermissions] request failed:', e);
      setStatus(
        prev =>
          prev ?? {bluetooth: 'denied', wifi: 'denied', location: 'denied'},
      );
    }
  }, []);

  // Ask right away when the add-device flow opens
  useEffect(() => {
    request();
  }, [request]);

  // Re-check after the user comes back from system Settings
  useEffect(() => {
    if (!isAndroid) {
      return;
    }
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkAll(statusRef.current)
          .then(setStatus)
          .catch(e =>
            console.error('[useDevicePermissions] re-check failed:', e),
          );
      }
    });
    return () => sub.remove();
  }, []);

  const allGranted =
    status !== null && PERMISSION_KEYS.every(k => status[k] === 'granted');
  const anyBlocked =
    status !== null && PERMISSION_KEYS.some(k => status[k] === 'blocked');

  return {
    status,
    allGranted,
    anyBlocked,
    request,
    openSettings: Linking.openSettings,
  };
};

export default useDevicePermissions;
