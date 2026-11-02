import React, {useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FText, WaterWaveBubblesBackground} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {Storage} from '@/core/utils/storage';
import LogoSvg from '@/assets/svg/logo.svg';
import {SCREEN_HEIGHT} from '@/core/constants';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const SLIDE_COUNT = 3;

export const OnboardingScreen: React.FC = () => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = createStyles(colors);
  const navigation = useAppNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const width = Dimensions.get('window').width;

  const dotRange = (i: number) => [(i - 1) * width, i * width, (i + 1) * width];

  const slides = [1, 2, 3].map(n => ({
    key: `slide${n}`,
    title: t(`onboarding.slide${n}.title`),
    subtitle: t(`onboarding.slide${n}.subtitle`),
  }));

  const finish = async () => {
    try {
      await Storage.setItem(Storage.KEY_FIRST_LOAD, false);
    } catch (e) {
      console.error('[OnboardingScreen] Error:', e);
    }
    navigation.replace('PhoneLogin');
  };

  const goTo = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({x: next * width, animated: true});
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) {
      setIndex(next);
    }
  };

  return (
    <View style={styles.container}>
      <WaterWaveBubblesBackground height={SCREEN_HEIGHT - 350} />
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        onMomentumScrollEnd={onMomentumScrollEnd}>
        {slides.map(slide => (
          <View key={slide.key} style={[styles.slide, {width}]}>
            <View style={styles.logoArea}>
              <LogoSvg
                width={width - 130}
              />
            </View>
            <View style={styles.textContent}>
              <FText typo="headline6" style={styles.title}>
                {slide.title}
              </FText>
              <FText
                typo="body02"
                color={colors.subtitle}
                style={styles.subtitle}>
                {slide.subtitle}
              </FText>
            </View>
          </View>
        ))}
      </ScrollView>
      <View
        style={[styles.footer, {paddingBottom: tokens.space.xl + insets.bottom}]}>
        <View style={styles.sideStart}>
          <TouchableOpacity testID="onboarding-skip" onPress={index !== SLIDE_COUNT - 1 ? finish : undefined}>
            <FText typo="bodyLabel03" color={colors.primary}>
              {index === SLIDE_COUNT - 1 ? '' : t('onboarding.skip')}
            </FText>
          </TouchableOpacity>
        </View>
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Animated.View
              key={slide.key}
              testID={`onboarding-dot-${i}`}
              style={[
                styles.dot,
                {
                  width: scrollX.interpolate({
                    inputRange: dotRange(i),
                    outputRange: [8, 20, 8],
                    extrapolate: 'clamp',
                  }),
                  backgroundColor: scrollX.interpolate({
                    inputRange: dotRange(i),
                    outputRange: [colors.grey2, colors.primary, colors.grey2],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.sideEnd}>
          <TouchableOpacity
            testID="onboarding-next"
            onPress={() =>
              index === SLIDE_COUNT - 1 ? finish() : goTo(index + 1)
            }>
            <FText
              typo="bodyLabel03"
              color={colors.primary}>
              {index === SLIDE_COUNT - 1
                ? t('onboarding.start')
                : t('onboarding.next')}
            </FText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white,
    },
    slide: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: tokens.space.lg,
    },
    logoArea: {
      flex: 1,
      justifyContent: 'center',
      marginBottom: tokens.space._7xl,
    },
    textContent: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 24,
      alignItems: 'center',
      paddingHorizontal: tokens.space.lg,
    },
    title: {
      textAlign: 'center',
    },
    subtitle: {
      marginTop: tokens.space.sm,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: tokens.space.lg,
      paddingBottom: tokens.space.xl,
    },
    sideStart: {
      flex: 1,
      alignItems: 'flex-start',
    },
    sideEnd: {
      flex: 1,
      alignItems: 'flex-end',
    },
    dots: {
      flexDirection: 'row',
    },
    dot: {
      height: 8,
      borderRadius: tokens.borderRadius.small,
      marginHorizontal: tokens.spacing._3xs,
    },
  });
