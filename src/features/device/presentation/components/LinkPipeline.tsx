import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';

export type LinkState = 'linking' | 'success' | 'failed';

const EASE_OUT = Easing.bezier(0.32, 0.72, 0, 1);
const NODE = 64;
const LINK = 56;
const MEDAL = 72;

/**
 * Phone → device → Wi-Fi pipeline shared by every add-device flow: dots stream
 * along the links while `linking`, the links solidify once settled.
 */
export const LinkPipeline: React.FC<{
  state: LinkState;
  deviceIcon: string;
}> = ({state, deviceIcon}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const tone = linkTone(colors, state);

  return (
    <View style={styles.pipeline} accessibilityRole="progressbar">
      <Node icon={FOutlined.phone} tone={tone} />
      <Link state={state} />
      <Node icon={deviceIcon} tone={tone} emphasis />
      <Link state={state} delay={500} />
      <Node icon={FOutlined.wifi} tone={tone} />
    </View>
  );
};

/** Check / cross that springs in under the pipeline; an empty slot while linking keeps the layout still. */
export const LinkMedal: React.FC<{state: LinkState}> = ({state}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return state === 'linking' ? (
    <View style={styles.medalSlot} />
  ) : (
    <Medal key={state} ok={state === 'success'} />
  );
};

/** Foreground / background pair for the current outcome. */
export const linkTone = (colors: ColorsProps, state: LinkState) =>
  state === 'failed'
    ? {fg: colors.error, bg: colors.errorBackground}
    : {fg: colors.primary, bg: colors.primaryBackground};

const Node: React.FC<{
  icon: string;
  tone: {fg: string; bg: string};
  emphasis?: boolean;
}> = ({icon, tone, emphasis}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.node, emphasis && styles.nodeEmphasis]}>
      <View style={[styles.nodeCore, {backgroundColor: tone.bg}]}>
        <FIcon icon={icon} size={emphasis ? 28 : 22} iconColor={tone.fg} />
      </View>
    </View>
  );
};

const Link: React.FC<{state: LinkState; delay?: number}> = ({
  state,
  delay = 0,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const flow = useRef(new Animated.Value(0)).current;
  const settle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'linking') {
      settle.setValue(0);
      Animated.timing(settle, {
        toValue: 1,
        duration: 600,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 1200,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    );
    flow.setValue(0);
    settle.setValue(0);
    loop.start();
    return () => loop.stop();
  }, [state, delay, flow, settle]);

  const lineColor = state === 'failed' ? colors.error : colors.primary;

  return (
    <View style={styles.link}>
      <View style={styles.linkTrack} />
      {state === 'linking' ? (
        [0, 1, 2].map(i => (
          <Animated.View
            key={i}
            style={[
              styles.linkDot,
              {
                opacity: flow.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: flow.interpolate({
                      inputRange: [0, 1],
                      // three dots spaced a third of the link apart
                      outputRange: [
                        (i * LINK) / 3 - LINK / 3,
                        (i * LINK) / 3 + LINK / 3,
                      ],
                    }),
                  },
                ],
              },
            ]}
          />
        ))
      ) : (
        <Animated.View
          style={[
            styles.linkFill,
            {backgroundColor: lineColor, transform: [{scaleX: settle}]},
          ]}
        />
      )}
    </View>
  );
};

const Medal: React.FC<{ok: boolean}> = ({ok}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // waits for the links to finish settling
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 70,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  return (
    <Animated.View
      style={[
        styles.medal,
        {backgroundColor: ok ? colors.primary : colors.error},
        {opacity: pop, transform: [{scale: pop}]},
      ]}>
      <FIcon
        icon={ok ? FOutlined.check : FOutlined.e_remove}
        size={36}
        iconColor={colors.white}
      />
    </Animated.View>
  );
};

export default LinkPipeline;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    pipeline: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    node: {
      width: NODE,
      height: NODE,
      borderRadius: tokens.borderRadius.full,
      padding: tokens.spacing._3xs,
      backgroundColor: colors.grey1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border1,
    },
    nodeEmphasis: {
      width: NODE + 24,
      height: NODE + 24,
    },
    nodeCore: {
      flex: 1,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    link: {
      width: LINK,
      height: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    linkTrack: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 3, // centres the 2px track in the 8px link box
      height: 2,
      backgroundColor: colors.border1,
    },
    linkDot: {
      position: 'absolute',
      width: 6,
      height: 6,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.primary,
    },
    linkFill: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 3, // same centring as linkTrack
      height: 2,
      transformOrigin: 'left',
    },
    medalSlot: {
      width: MEDAL,
      height: MEDAL,
    },
    medal: {
      width: MEDAL,
      height: MEDAL,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.black,
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: {width: 0, height: 10},
      elevation: 3,
    },
  });
