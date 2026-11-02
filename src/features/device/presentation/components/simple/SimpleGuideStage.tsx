import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {findDeviceModel} from '../../../domain/entities/Device';
import {MODEL_ICONS} from '../../screens/AddDeviceScreen';
import {EASE, FadeIn, SolidPill} from './SimpleUi';

const STEPS = ['step1', 'step2', 'step3'] as const;

/** Manual path: put the chosen model into pairing mode, then connect. */
export const SimpleGuideStage: React.FC<{
  modelId: string;
  onNext: () => void;
}> = ({modelId, onNext}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <FadeIn>
          <FText typo="headline6">{t('device.simple.guideTitle')}</FText>
        </FadeIn>

        <FadeIn delay={80} style={styles.hero}>
          <View style={styles.stage}>
            <View style={styles.device}>
              <FIcon
                icon={MODEL_ICONS[modelId] ?? FOutlined.device_connection}
                size={56}
                iconColor={colors.title}
              />
              <BlinkLed />
            </View>
            <FText typo="bodyLabel03" color={colors.subtitle}>
              {findDeviceModel(modelId)?.name ?? ''}
            </FText>
          </View>
          <View style={styles.note}>
            <View style={styles.noteDot} />
            <FText typo="body04" style={styles.flex}>
              {t('device.simple.blinkNote')}
            </FText>
          </View>
        </FadeIn>

        <FadeIn delay={160} style={styles.steps}>
          <FText typo="body03" color={colors.subtitle}>
            {t('device.simple.stepsIntro')}
          </FText>
          {STEPS.map((key, i) => (
            <View key={key} style={styles.step}>
              <View style={styles.badge}>
                <FText typo="body05" color={colors.background}>
                  {i + 1}
                </FText>
              </View>
              <FText typo="body03">{t(`device.simple.${key}`)}</FText>
            </View>
          ))}
        </FadeIn>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {paddingBottom: insets.bottom + tokens.space.md},
        ]}>
        <SolidPill label={t('device.simple.connect')} onPress={onNext} />
      </View>
    </View>
  );
};

/** Fast-blinking status LED — the thing the user is told to look for. */
const BlinkLed: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.15,
          duration: 260,
          easing: EASE,
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 260,
          easing: EASE,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);

  return <Animated.View style={[styles.led, {opacity: blink}]} />;
};

export default SimpleGuideStage;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space.lg,
      gap: tokens.space.lg,
    },
    hero: {
      borderRadius: tokens.borderRadius.medium + tokens.spacing._2xs,
      backgroundColor: colors.grey1,
      padding: tokens.spacing.s,
      gap: tokens.spacing.s,
    },
    stage: {
      alignItems: 'center',
      gap: tokens.spacing.xs,
      paddingVertical: tokens.space.lg,
    },
    device: {
      width: 136,
      height: 136,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
    },
    led: {
      position: 'absolute',
      top: 28,
      right: 28,
      width: 12,
      height: 12,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.primary,
    },
    note: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
    },
    noteDot: {
      width: 8,
      height: 8,
      borderRadius: tokens.borderRadius.full,
      backgroundColor: colors.primary,
    },
    steps: {
      gap: tokens.spacing.xs,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    badge: {
      width: 24,
      height: 24,
      borderRadius: tokens.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.title,
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
    },
  });
