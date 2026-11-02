import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FButton, FCheckbox, FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {findDeviceModel} from '../../domain/entities/Device';
import {BlinkingDevice} from '../components/BlinkingDevice';
import {StepsCard} from '../components/StepsCard';

/** C2 step 2: how to put the chosen model into pairing mode. */
export const DeviceResetScreen: React.FC = () => {
  const {params} = useRoute<RouteProp<RootStackParamList, 'DeviceReset'>>();
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [confirmed, setConfirmed] = useState(false);
  const modelName = findDeviceModel(params.modelId)?.name ?? '';

  return (
    <View style={styles.container}>
      <FAppbar
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <FText typo="headline8">{t('device.reset.title')}</FText>
          <FText typo="body03" color={colors.subtitle}>
            {t('device.reset.subtitle', {name: modelName.toLowerCase()})}
          </FText>
        </View>
        {/* ponytail: one generic reset guide for every model — add per-model steps/art when firmware docs land */}
        <BlinkingDevice />
        <StepsCard
          steps={[
            t('device.reset.step1'),
            t('device.reset.step2'),
            t('device.reset.step3'),
          ]}
        />
      </ScrollView>
      <View
        style={[
          styles.footer,
          {paddingBottom: insets.bottom + tokens.space.md},
        ]}>
        <FCheckbox
          checked={confirmed}
          onPress={() => setConfirmed(v => !v)}
          title={t('device.reset.confirm')}
        />
        <FButton
          width="block"
          disabled={!confirmed}
          title={t('device.reset.continue')}
          onPress={() =>
            navigation.navigate('WifiSetup', {modelId: params.modelId})
          }
        />
      </View>
    </View>
  );
};

export default DeviceResetScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
      paddingBottom: tokens.space.lg,
      gap: tokens.space.md,
    },
    header: {
      gap: tokens.spacing._3xs,
    },
    footer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.md,
      gap: tokens.space.md,
      borderTopWidth: 1,
      borderTopColor: colors.border1,
      backgroundColor: colors.white,
    },
  });
