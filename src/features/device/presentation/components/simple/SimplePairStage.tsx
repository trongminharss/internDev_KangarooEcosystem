import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {container} from '@/core/di/container';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {
  DiscoveredDevice,
  WifiSelection,
  findDeviceModel,
} from '../../../domain/entities/Device';
import {MODEL_ICONS} from '../../screens/AddDeviceScreen';
import {Eyebrow} from '../Eyebrow';
import {LinkMedal, LinkPipeline, LinkState, linkTone} from '../LinkPipeline';
import {CircleButton, FadeIn, SolidPill} from './SimpleUi';

type PairState = 'finding' | 'pairing' | 'success' | 'failed';

// ponytail: 60s to spot the chosen model on the manual path; tune with real BLE timings
export const FIND_TIMEOUT_MS = 60_000;

/**
 * Waiting → result. On the manual path (no device yet) it first scans for the
 * chosen model, then provisions the first match.
 */
export const SimplePairStage: React.FC<{
  modelId: string;
  device?: DiscoveredDevice;
  wifi: WifiSelection;
  onBusyChange: (busy: boolean) => void;
  onHome: () => void;
  onAgain: () => void;
  onChangeWifi: () => void;
}> = ({
  modelId,
  device: picked,
  wifi,
  onBusyChange,
  onHome,
  onAgain,
  onChangeWifi,
}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const [state, setState] = useState<PairState>(picked ? 'pairing' : 'finding');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  // a device found on the first attempt is reused by retries
  const device = useRef(picked);

  useEffect(() => {
    let alive = true;
    let stopScan: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fail = (message: string) => {
      if (alive) {
        setError(message);
        setState('failed');
      }
    };
    const provision = (target: DiscoveredDevice) => {
      device.current = target;
      setState('pairing');
      container.provisionDeviceUseCase
        .execute({deviceId: target.id, ...wifi})
        .then(() => alive && setState('success'))
        .catch((e: any) => fail(e?.message ?? ''));
    };

    if (device.current) {
      provision(device.current);
    } else {
      setState('finding');
      let found = false;
      timer = setTimeout(() => {
        stopScan?.();
        fail(t('device.scan.notFound'));
      }, FIND_TIMEOUT_MS);
      stopScan = container.scanDevicesUseCase.execute(d => {
        if (found || !alive) {
          return;
        }
        found = true;
        clearTimeout(timer);
        // the callback may fire before execute() returns, so stop on the next tick
        setTimeout(() => stopScan?.(), 0);
        provision(d);
      }, modelId);
    }

    return () => {
      alive = false;
      stopScan?.();
      clearTimeout(timer);
    };
  }, [attempt, modelId, wifi, t]);

  const busy = state === 'finding' || state === 'pairing';
  // finding and pairing both read as "linking" on the pipeline
  const link: LinkState = busy ? 'linking' : state;
  const tone = linkTone(colors, link);
  useEffect(() => onBusyChange(busy), [busy, onBusyChange]);

  const name = device.current?.name ?? findDeviceModel(modelId)?.name ?? '';

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <FadeIn>
          <LinkPipeline
            state={link}
            deviceIcon={MODEL_ICONS[modelId] ?? FOutlined.device_connection}
          />
        </FadeIn>
        <LinkMedal state={link} />

        <FadeIn key={state} style={styles.text}>
          <Eyebrow label={wifi.credentials.ssid} color={tone.fg} bg={tone.bg} />
          <FText typo="headline7" style={styles.center}>
            {state === 'finding'
              ? t('device.simple.finding', {name})
              : state === 'pairing'
              ? t('device.simple.pairing')
              : state === 'success'
              ? t('device.simple.success', {name})
              : t('device.connect.failedTitle')}
          </FText>
          <FText typo="body03" color={colors.subtitle} style={styles.center}>
            {state === 'success'
              ? t('device.simple.successHint', {ssid: wifi.credentials.ssid})
              : state === 'failed'
              ? error || t('device.connect.failedHint')
              : t('device.simple.pairingHint')}
          </FText>
        </FadeIn>
      </View>

      {!busy && (
        <FadeIn
          style={[
            styles.footer,
            {paddingBottom: insets.bottom + tokens.space.md},
          ]}>
          {state === 'success' ? (
            <>
              <CircleButton
                icon={FOutlined.home}
                accessibilityLabel={t('home.title')}
                onPress={onHome}
                style={styles.side}
              />
              <View style={styles.flex}>
                <SolidPill label={t('device.simple.again')} onPress={onAgain} />
              </View>
            </>
          ) : (
            <>
              <CircleButton
                icon={FOutlined.wifi}
                accessibilityLabel={t('device.connect.changeWifi')}
                onPress={onChangeWifi}
                style={styles.side}
              />
              <View style={styles.flex}>
                <SolidPill
                  label={t('device.connect.retry')}
                  onPress={() => setAttempt(n => n + 1)}
                />
              </View>
            </>
          )}
        </FadeIn>
      )}
    </View>
  );
};

export default SimplePairStage;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.xl,
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space._5xl,
  },
  text: {
    alignItems: 'center',
    gap: tokens.spacing._2xs,
  },
  center: {
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.space.md,
  },
  side: {
    width: 56,
    height: 56,
  },
});
