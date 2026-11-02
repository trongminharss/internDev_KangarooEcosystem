import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {BackHandler, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FOutlined, tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {DiscoveredDevice, WifiSelection} from '../../domain/entities/Device';
import {SimpleFindStage} from '../components/simple/SimpleFindStage';
import {SimpleGuideStage} from '../components/simple/SimpleGuideStage';
import {SimplePairStage} from '../components/simple/SimplePairStage';
import {SimpleWifiStage} from '../components/simple/SimpleWifiStage';
import {CircleButton} from '../components/simple/SimpleUi';

// `device` is known on the scan path; the manual path only knows the model until pairing finds it
type Target = {modelId: string; device?: DiscoveredDevice};
type Stage =
  | {name: 'find'}
  | ({name: 'guide'} & Target)
  | ({name: 'wifi'} & Target)
  | ({name: 'pair'} & Target & {wifi: WifiSelection});

/**
 * Minimal add-device flow modelled on a plain list + guide + wait + done layout.
 * Independent of AddDevice; shares only the domain use cases.
 */
export const SimpleAddDeviceScreen: React.FC = () => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [stage, setStage] = useState<Stage>({name: 'find'});
  const [busy, setBusy] = useState(false);

  const back = useCallback(() => {
    if (busy) {
      return;
    }
    switch (stage.name) {
      case 'find':
        navigation.goBack();
        break;
      case 'guide':
        setStage({name: 'find'});
        break;
      case 'wifi':
        setStage(
          stage.device
            ? {name: 'find'}
            : {name: 'guide', modelId: stage.modelId},
        );
        break;
      case 'pair':
        setStage({name: 'wifi', modelId: stage.modelId, device: stage.device});
        break;
    }
  }, [busy, stage, navigation]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      back();
      return true;
    });
    return () => sub.remove();
  }, [back]);

  const done = stage.name === 'pair';

  return (
    <View style={[styles.container, {paddingTop: insets.top}]}>
      <View style={styles.topBar}>
        {/* pairing owns the whole screen: no back while busy, home button once settled */}
        {!done && (
          <CircleButton
            icon={FOutlined.arrown_left}
            accessibilityLabel={t('device.simple.back')}
            onPress={back}
          />
        )}
      </View>

      {stage.name === 'find' && (
        <SimpleFindStage
          onSelect={device =>
            setStage({name: 'wifi', modelId: device.modelId, device})
          }
          onManual={modelId => setStage({name: 'guide', modelId})}
        />
      )}
      {stage.name === 'guide' && (
        <SimpleGuideStage
          modelId={stage.modelId}
          onNext={() => setStage({name: 'wifi', modelId: stage.modelId})}
        />
      )}
      {stage.name === 'wifi' && (
        <SimpleWifiStage
          onSubmit={wifi =>
            setStage({
              name: 'pair',
              modelId: stage.modelId,
              device: stage.device,
              wifi,
            })
          }
        />
      )}
      {stage.name === 'pair' && (
        <SimplePairStage
          modelId={stage.modelId}
          device={stage.device}
          wifi={stage.wifi}
          onBusyChange={setBusy}
          onHome={() => navigation.popTo('BottomNavigation')}
          onAgain={() => setStage({name: 'find'})}
          onChangeWifi={() =>
            setStage({
              name: 'wifi',
              modelId: stage.modelId,
              device: stage.device,
            })
          }
        />
      )}
    </View>
  );
};

export default SimpleAddDeviceScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.space.sm,
      minHeight: 64,
    },
  });
