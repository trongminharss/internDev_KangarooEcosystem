import {useCallback, useRef, useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {container} from '@/core/di/container';
import {DiscoveredDevice} from '../../domain/entities/Device';
import {hasAllDevicePermissions} from './useDevicePermissions';

// ponytail: 30s background look-around while the screen is focused; tune with real BLE
export const NEARBY_SCAN_MS = 30_000;

/**
 * While the host screen is focused and every device permission is already granted,
 * quietly scans for `modelId` and surfaces the first match once per app session.
 * Never prompts for permissions itself.
 */
export const useNearbyDevicePrompt = (modelId: string) => {
  const [device, setDevice] = useState<DiscoveredDevice | null>(null);
  const [visible, setVisible] = useState(false);
  const shown = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (shown.current) {
        return;
      }
      let alive = true;
      let stopScan: (() => void) | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;

      hasAllDevicePermissions()
        .then(granted => {
          if (!alive || !granted) {
            return;
          }
          timer = setTimeout(() => stopScan?.(), NEARBY_SCAN_MS);
          stopScan = container.scanDevicesUseCase.execute(found => {
            if (!alive || shown.current) {
              return;
            }
            shown.current = true;
            clearTimeout(timer);
            // the callback may fire before execute() returns, so stop on the next tick
            setTimeout(() => stopScan?.(), 0);
            setDevice(found);
            setVisible(true);
          }, modelId);
        })
        .catch(e =>
          console.error('[useNearbyDevicePrompt] permission check failed:', e),
        );

      return () => {
        alive = false;
        stopScan?.();
        clearTimeout(timer);
      };
    }, [modelId]),
  );

  const dismiss = useCallback(() => setVisible(false), []);

  return {device, visible, dismiss};
};

export default useNearbyDevicePrompt;
