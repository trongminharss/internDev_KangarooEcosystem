import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/core/theme';
import {FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';

export type GreetingKey = 'morning' | 'noon' | 'afternoon' | 'evening';

export const getGreetingKey = (hour: number): GreetingKey => {
  if (hour < 5 || hour >= 18) {
    return 'evening';
  }
  if (hour < 11) {
    return 'morning';
  }
  if (hour < 13) {
    return 'noon';
  }
  return 'afternoon';
};

interface HomeHeaderProps {
  onAvatarPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({onAvatarPress}) => {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const {colors} = theme;
  const greeting = getGreetingKey(new Date().getHours());

  return (
    <View style={styles.container} testID="home-header">
      <FText typo="headline8">{t(`home.greeting.${greeting}`)}</FText>
      <Pressable
        testID="avatar-button"
        accessibilityRole="button"
        accessibilityLabel={t('tab.account')}
        hitSlop={tokens.space.xs}
        onPress={onAvatarPress}>
        <FIcon icon={FFilled.user_profile} size={24} iconColor={colors.title} />
      </Pressable>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.space.lg,
  },
});
