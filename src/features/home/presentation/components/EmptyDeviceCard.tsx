import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useTheme} from '@/core/theme';
import {FButton, FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';

interface EmptyDeviceCardProps {
  onConnect: () => void;
}

const EmptyDeviceCard: React.FC<EmptyDeviceCardProps> = ({onConnect}) => {
  const {t} = useTranslation();
  const {theme, isDark} = useTheme();
  const {colors} = theme;

  return (
    <View style={styles.container} testID="device-banner">
      <Svg style={styles.gradient}>
        <Defs>
          <LinearGradient id="deviceBannerGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop
              offset="0"
              stopColor={isDark ? colors.blue500 : colors.blue200}
            />
            <Stop
              offset={isDark ? '0.45' : '0.5'}
              stopColor={isDark ? colors.blue800 : colors.blue100}
            />
            <Stop
              offset="1"
              stopColor={isDark ? colors.bgDarkBase : colors.blue50}
            />
          </LinearGradient>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          rx={tokens.borderRadius.medium}
          fill="url(#deviceBannerGradient)"
        />
      </Svg>
      <View style={styles.content}>
        <FIcon
          icon={FOutlined.hyperlink}
          size={40}
          iconColor={colors.title}
        />
        <FText
          typo="bodyLabel02"
          color={colors.title}
          style={styles.message}>
          {t('home.device.empty')}
        </FText>
        <FButton
          title={t('home.device.connect')}
          color="success"
          size="m"
          width={160}
          testID="device-connect"
          onPress={onConnect}
        />
      </View>
    </View>
  );
};

export default EmptyDeviceCard;

const styles = StyleSheet.create({
  container: {
    borderRadius: tokens.borderRadius.medium,
    overflow: 'hidden',
    marginBottom: tokens.space.lg,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    gap: tokens.space.md,
    paddingVertical: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
  },
  message: {
    textAlign: 'center',
  },
});
