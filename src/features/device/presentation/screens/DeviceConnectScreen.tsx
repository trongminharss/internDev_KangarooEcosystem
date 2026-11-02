import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {container} from '@/core/di/container';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FButton, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {Eyebrow} from '../components/Eyebrow';
import {
  LinkMedal,
  LinkPipeline,
  LinkState,
  linkTone,
} from '../components/LinkPipeline';
import {MODEL_ICONS} from './AddDeviceScreen';

type ConnectState = 'connecting' | 'success' | 'failed';

/** Final step of both flows: send Wi-Fi to the device and report the result. */
export const DeviceConnectScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'DeviceConnect'>>();
  const {device, wifi} = params;
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<ConnectState>('connecting');
  const [error, setError] = useState('');

  const connect = useCallback(() => {
    let alive = true;
    setState('connecting');
    container.provisionDeviceUseCase
      .execute({deviceId: device.id, ...wifi})
      .then(() => alive && setState('success'))
      .catch((e: any) => {
        if (alive) {
          setError(e?.message ?? '');
          setState('failed');
        }
      });
    return () => {
      alive = false;
    };
  }, [device.id, wifi]);

  useEffect(connect, [connect]);

  const finish = () => navigation.popTo('BottomNavigation');

  const isConnecting = state === 'connecting';
  const link: LinkState = isConnecting ? 'linking' : state;
  const tone = linkTone(colors, link);

  return (
    <View style={styles.container}>
      <FAppbar
        noContent={isConnecting}
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <View style={styles.body}>
        <LinkPipeline
          state={link}
          deviceIcon={
            MODEL_ICONS[device.modelId] ?? FOutlined.device_connection
          }
        />
        <LinkMedal state={link} />
        <Eyebrow label={wifi.credentials.ssid} color={tone.fg} bg={tone.bg} />
        <FText typo="headline8" style={styles.center}>
          {t(`device.connect.${isConnecting ? 'connecting' : `${state}Title`}`)}
        </FText>
        <FText typo="body03" color={colors.subtitle} style={styles.center}>
          {state === 'success'
            ? t('device.connect.successDesc', {
                name: device.name,
                ssid: wifi.credentials.ssid,
              })
            : state === 'failed'
            ? [error, t('device.connect.failedHint')].filter(Boolean).join('\n')
            : t('device.connect.connectingHint')}
        </FText>
      </View>

      {!isConnecting && (
        <View
          style={[
            styles.footer,
            {paddingBottom: insets.bottom + tokens.space.md},
          ]}>
          {state === 'success' ? (
            <FButton
              width="block"
              title={t('device.connect.done')}
              onPress={finish}
            />
          ) : (
            <>
              <FButton
                width="block"
                title={t('device.connect.retry')}
                onPress={connect}
              />
              <FButton
                width="block"
                kind="ghost"
                title={t('device.connect.changeWifi')}
                onPress={navigation.goBack}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default DeviceConnectScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.space.md,
      gap: tokens.space.lg,
    },
    center: {
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.md,
      gap: tokens.spacing._2xs,
    },
  });
