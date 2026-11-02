import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ColorsProps, useTheme} from '@/core/theme';
import {FAppbar, FIcon, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {DEVICE_CATALOG} from '../../domain/entities/Device';
import {useDevicePermissions} from '../hooks/useDevicePermissions';
import {DeviceScanSection} from '../components/DeviceScanSection';
import {PermissionGate} from '../components/PermissionGate';
import {StepsCard} from '../components/StepsCard';

export const MODEL_ICONS: Record<string, string> = {
  'water-purifier': FOutlined.rain,
  'air-purifier': FOutlined.wind,
  'smart-socket': FOutlined.button_power,
  'smart-switch': FOutlined.switches,
};

/** Entry of the add-device flow: permission gate → BLE scan (C1) + manual catalog (C2). */
export const AddDeviceScreen: React.FC = () => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {theme} = useTheme();
  const {colors} = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {status, allGranted, anyBlocked, request, openSettings} =
    useDevicePermissions();

  return (
    <View style={styles.container}>
      <FAppbar
        title={t('device.addTitle')}
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {paddingBottom: insets.bottom + tokens.space.lg},
        ]}>
        {status === null ? null : !allGranted ? (
          <PermissionGate
            status={status}
            anyBlocked={anyBlocked}
            onRequest={request}
            onOpenSettings={openSettings}
          />
        ) : (
          <>
            <DeviceScanSection
              onSelect={device =>
                navigation.navigate('WifiSetup', {
                  modelId: device.modelId,
                  device,
                })
              }
            />
            <StepsCard
              title={t('device.tips.title')}
              steps={[
                t('device.tips.step1'),
                t('device.tips.step2'),
                t('device.tips.step3'),
              ]}
            />
            <View style={styles.manual}>
              <View>
                <FText typo="bodyLabel02">{t('device.manual.title')}</FText>
                <FText typo="body04" color={colors.subtitle}>
                  {t('device.manual.subtitle')}
                </FText>
              </View>
              <View style={styles.grid}>
                {DEVICE_CATALOG.map(model => (
                  <TouchableOpacity
                    key={model.id}
                    activeOpacity={0.7}
                    style={styles.tile}
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.navigate('DeviceReset', {modelId: model.id})
                    }>
                    <View style={styles.tileIcon}>
                      <FIcon
                        icon={
                          MODEL_ICONS[model.id] ?? FOutlined.device_connection
                        }
                        size={24}
                        iconColor={colors.title}
                      />
                    </View>
                    <FText typo="bodyLabel03" numberOfLines={2}>
                      {model.name}
                    </FText>
                    <FText typo="body05" color={colors.subtitle}>
                      {t(
                        `device.manual.category.${model.category}`,
                      ).toUpperCase()}
                    </FText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AddDeviceScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.md,
      gap: tokens.space.lg,
    },
    manual: {
      gap: tokens.space.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: tokens.spacing._2xs,
    },
    tile: {
      flexGrow: 1,
      flexBasis: '40%', // two columns; flexGrow absorbs the gap
      gap: tokens.spacing._3xs,
      padding: tokens.spacing.s,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border1,
      borderRadius: tokens.borderRadius.medium,
    },
    tileIcon: {
      width: 44,
      height: 44,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.grey1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: tokens.spacing._3xs,
    },
  });
