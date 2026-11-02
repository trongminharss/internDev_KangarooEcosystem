import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, View} from 'react-native';
import {WebView, WebViewMessageEvent} from 'react-native-webview';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {PURIFIER_3D_HTML} from '../assets/purifier3dHtml';

interface Props {
  hotOn: boolean;
  coldOn: boolean;
  onSwitchChange: (channel: 'hot' | 'cold', on: boolean) => void;
}

type WebState = {
  doorOpen: boolean;
  pouringHot: boolean;
  pouringCold: boolean;
  autoRotate: boolean;
};

// Hides the HTML control panel; the RN overlay below replaces it.
const BEFORE_LOAD = 'window.__EMBED__ = true; true;';

export const PurifierViewer: React.FC<Props> = ({
  hotOn,
  coldOn,
  onSwitchChange,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const web = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [web3d, setWeb3d] = useState<WebState>({
    doorOpen: false,
    pouringHot: false,
    pouringCold: false,
    autoRotate: false,
  });

  const run = (cmd: string, value?: unknown) =>
    web.current?.injectJavaScript(
      `window.purifier && window.purifier(${JSON.stringify(
        cmd,
      )}, ${JSON.stringify(value ?? null)}); true;`,
    );

  // App switches -> LEDs / rocker switches on the model.
  useEffect(() => {
    if (ready) {
      run('switchHot', hotOn);
      run('switchCold', coldOn);
    }
  }, [ready, hotOn, coldOn]);

  useEffect(() => {
    if (ready) {
      run('bg', colors.grey1);
    }
  }, [ready, colors.grey1]);

  const onMessage = (e: WebViewMessageEvent) => {
    const msg = JSON.parse(e.nativeEvent.data);
    if (msg.type !== 'state') {
      return;
    }
    if (msg.ready) {
      setReady(true);
    }
    setWeb3d(msg);
    // Only a rocker tapped inside the 3D scene syncs back; echoes of our own
    // commands can carry the other channel's stale value and would undo it.
    if (!msg.user) {
      return;
    }
    if (msg.hot !== hotOn) {
      onSwitchChange('hot', msg.hot);
    }
    if (msg.cold !== coldOn) {
      onSwitchChange('cold', msg.cold);
    }
  };

  const controls = [
    {
      key: 'door',
      label: t(`device.viewer.${web3d.doorOpen ? 'closeDoor' : 'openDoor'}`),
      active: web3d.doorOpen,
    },
    {
      key: 'hot',
      label: t(`device.viewer.${web3d.pouringHot ? 'stop' : 'pourHot'}`),
      active: web3d.pouringHot,
    },
    {
      key: 'cold',
      label: t(`device.viewer.${web3d.pouringCold ? 'stop' : 'pourCold'}`),
      active: web3d.pouringCold,
    },
    {key: 'rotate', label: t('device.viewer.rotate'), active: web3d.autoRotate},
  ];

  return (
    <View style={styles.container}>
      {failed ? (
        <View style={styles.center}>
          <FIcon
            icon={FOutlined.wifi_off}
            size={32}
            iconColor={colors.subtitle}
          />
          <FText
            typo="body03"
            color={colors.subtitle}
            style={styles.centerText}>
            {t('device.viewer.loadFailed')}
          </FText>
          <Pressable
            onPress={() => {
              setFailed(false);
              web.current?.reload();
            }}>
            <FText typo="bodyLabel03" color={colors.primary}>
              {t('device.viewer.retry')}
            </FText>
          </Pressable>
        </View>
      ) : (
        // P defaults to `undefined` in the typings, which intersects props to `never`.
        <WebView<object>
          ref={web}
          source={{html: PURIFIER_3D_HTML, baseUrl: 'https://localhost/'}}
          originWhitelist={['*']}
          injectedJavaScriptBeforeContentLoaded={BEFORE_LOAD}
          onMessage={onMessage}
          onError={() => setFailed(true)}
          style={styles.web}
          scrollEnabled={false}
          nestedScrollEnabled
          overScrollMode="never"
          bounces={false}
        />
      )}

      {!ready && !failed && (
        <View
          style={[StyleSheet.absoluteFill, styles.center]}
          pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      )}

      {ready && !failed && (
        <View style={styles.controls}>
          {controls.map(c => (
            <Pressable
              key={c.key}
              onPress={() => run(c.key)}
              style={({pressed}) => [
                styles.chip,
                c.active && {backgroundColor: colors.title},
                pressed && {transform: [{scale: 0.97}]},
              ]}>
              <FText
                typo="bodyLabel04"
                color={c.active ? colors.white : colors.title}>
                {c.label}
              </FText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

export default PurifierViewer;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      height: 360,
      backgroundColor: colors.grey1,
      borderRadius: tokens.borderRadius.medium,
      overflow: 'hidden',
    },
    web: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: tokens.spacing._2xs,
      paddingHorizontal: tokens.space.lg,
    },
    centerText: {
      textAlign: 'center',
    },
    controls: {
      position: 'absolute',
      left: tokens.spacing.xs,
      right: tokens.spacing.xs,
      bottom: tokens.spacing.xs,
      flexDirection: 'row',
      gap: tokens.spacing._2xs,
    },
    chip: {
      flex: 1,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.white,
    },
  });
