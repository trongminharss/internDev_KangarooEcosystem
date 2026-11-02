import {StyleSheet, View} from 'react-native';
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import LottieView from 'lottie-react-native';
import {useAppNavigation} from '@/app/navigation/types';
import {Storage} from '@/core/utils/storage';
import {ColorsProps, useTheme} from '@/core/theme';

// ponytail: 4.5s fallback in case onAnimationFinish never fires (native load failure);
// the animation itself is 4s (240 frames @ 60fps)
const SPLASH_FALLBACK_MS = 4500;

export const SplashScreen: React.FC = () => {
  const navigation = useAppNavigation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const hasNavigated = useRef(false);

  const navigateNext = useCallback(async () => {
    if (hasNavigated.current) {
      return;
    }
    hasNavigated.current = true;
    try {
      const isFirstLoad =
        (await Storage.getItem<boolean>(Storage.KEY_FIRST_LOAD)) ?? true;
      navigation.replace(isFirstLoad ? 'Onboarding' : 'PhoneLogin');
    } catch (e) {
      console.error('[SplashScreen] Error:', e);
      navigation.replace('PhoneLogin');
    }
  }, [navigation]);

  useEffect(() => {
    const timeoutId = setTimeout(navigateNext, SPLASH_FALLBACK_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [navigateNext]);

  return (
    <View style={styles.container}>
      <LottieView
        source={
          isDark
            ? require('../../../../assets/json/kgr_dark_splash.json')
            : require('../../../../assets/json/kgrsplash.json')
        }
        autoPlay
        loop={false}
        resizeMode="cover"
        style={styles.animation}
        onAnimationFinish={navigateNext}
      />
    </View>
  );
};

export default SplashScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    animation: {
      flex: 1,
      width: '100%',
    },
  });
