import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, Pressable, StyleSheet, View} from 'react-native';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {usePurifier} from '../hooks/usePurifier';
import {WaterModePanel, palettes} from '../components/WaterModePanel';
import {WaterChannelKey} from '../purifierUtils';

/** Full-screen hot/cold temperature control opened from the detail overview. */
export const WaterModeScreen: React.FC = () => {
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const s = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'WaterMode'>>();
  const p = usePurifier();
  const [active, setActive] = useState<WaterChannelKey>(
    route.params?.channel ?? 'hot',
  );
  const glow = palettes(colors)[active].mid;
  const lit = p[active].on;

  const bloom = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(bloom, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [bloom]);

  return (
    <View
      style={[
        s.container,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom + tokens.space.md,
        },
      ]}>
      <Animated.View
        pointerEvents="none"
        style={[
          s.glow,
          {
            opacity: bloom.interpolate({
              inputRange: [0, 1],
              outputRange: [0, lit ? (isDark ? 0.55 : 0.3) : 0.12],
            }),
            transform: [
              {
                scale: bloom.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="bloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={glow} stopOpacity={0.6} />
              <Stop offset="1" stopColor={glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bloom)" />
        </Svg>
      </Animated.View>

      <View style={s.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('device.waterMode.back')}
          hitSlop={8}
          onPress={navigation.goBack}
          style={({pressed}) => [s.back, pressed && s.pressed]}>
          <FIcon
            icon={FOutlined.left_arrow}
            size={22}
            iconColor={colors.title}
          />
        </Pressable>
        <FText typo="headline7" color={colors.title}>
          {t('device.waterMode.title')}
        </FText>
      </View>

      <View style={s.body}>
        <WaterModePanel
          hot={p.hot}
          cold={p.cold}
          setHotOn={p.setHotOn}
          setColdOn={p.setColdOn}
          setHotTemp={p.setHotTemp}
          setColdTemp={p.setColdTemp}
          active={active}
          onActiveChange={setActive}
        />
      </View>
    </View>
  );
};

export default WaterModeScreen;

const GLOW = 420;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Soft halo in the channel colour behind the readout.
    glow: {
      position: 'absolute',
      width: GLOW,
      height: GLOW,
      top: 80,
      right: -GLOW / 2.5,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.spacing.xs,
    },
    back: {
      width: 40,
      height: 40,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.grey1,
    },
    pressed: {
      transform: [{scale: 0.94}],
    },
    body: {
      flex: 1,
      paddingHorizontal: tokens.space.md,
    },
  });
