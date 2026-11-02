import {useCallback, useEffect, useState} from 'react';
import {useIsFocused} from '@react-navigation/native';
import {container} from '@/core/di/container';
import {useCountdown} from '@/shared/hooks/useCountdown';
import {DiscoveredDevice} from '../../domain/entities/Device';

export const SCAN_SECONDS = 120;

/** 2-minute BLE scan; pauses while the screen is covered so it never fights provisioning. */
export const useDeviceScan = (modelId?: string) => {
  const isFocused = useIsFocused();
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const {seconds, isDone, restart} = useCountdown(SCAN_SECONDS);
  const isScanning = isFocused && !isDone;

  useEffect(() => {
    if (!isScanning) {
      return;
    }
    return container.scanDevicesUseCase.execute(
      device =>
        setDevices(prev =>
          prev.some(d => d.id === device.id) ? prev : [...prev, device],
        ),
      modelId,
    );
  }, [isScanning, modelId]);

  const rescan = useCallback(() => {
    setDevices([]);
    restart();
  }, [restart]);

  return {devices, seconds, isScanning, isDone, rescan};
};

export const formatSeconds = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default useDeviceScan;
