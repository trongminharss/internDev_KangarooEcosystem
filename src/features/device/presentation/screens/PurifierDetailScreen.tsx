import React, {useMemo, useRef} from 'react';
import {Linking, ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {
  FAppbar,
  FBottomSheetRef,
  FIconButton,
  FText,
} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {useAppNavigation} from '@/app/navigation/types';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {usePurifier} from '../hooks/usePurifier';
import {PurifierViewer} from '../components/PurifierViewer';
import {WaterQualitySection} from '../components/WaterQualitySection';
import {FilterSection} from '../components/FilterSection';
import {WaterModeSection} from '../components/WaterModeSection';
import {EcoModeSection} from '../components/EcoModeSection';
import {HistorySection} from '../components/HistorySection';
import {ActionsSection, DeviceAction} from '../components/ActionsSection';
import {SettingsSheet} from '../components/SettingsSheet';
import {formatHour} from '../purifierUtils';

export const PurifierDetailScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {showSnackbar} = useFSnackbar();
  const p = usePurifier();
  const {device, hot, cold, eco} = p;
  const settingsSheetRef = useRef<FBottomSheetRef>(null);

  const channelState = (ch: {on: boolean; temp: number}) =>
    ch.on
      ? t('device.snapshot.onTemp', {temp: ch.temp})
      : t('device.snapshot.off');

  const onAction = (a: DeviceAction) => {
    switch (a) {
      case 'feedback':
        return navigation.navigate('DeviceFeedback', {
          snapshot: [
            [t('device.snapshot.model'), device.model],
            [t('device.snapshot.serial'), device.serial],
            [t('device.snapshot.firmware'), `v${device.firmware}`],
            [
              t('device.snapshot.connection'),
              t(`device.snapshot.${device.online ? 'online' : 'offline'}`),
            ],
            [
              t('device.snapshot.tds'),
              `${device.tdsIn} / ${device.tdsOut} ppm`,
            ],
            [t('device.snapshot.hot'), channelState(hot)],
            [t('device.snapshot.cold'), channelState(cold)],
            [
              t('device.snapshot.eco'),
              eco.on
                ? `${formatHour(eco.range[0])} - ${formatHour(eco.range[1])}`
                : t('device.snapshot.off'),
            ],
            [
              t('device.snapshot.lowestFilter'),
              `${Math.min(...device.filters.map(f => f.remainingPercent))}%`,
            ],
          ],
        });
      case 'warranty':
        return navigation.navigate('Warranty');
      case 'maintenance':
      case 'chat':
        return navigation.navigate('BottomNavigation', {
          screen: 'Service',
          params: {topic: a},
        });
      case 'call':
        return Linking.openURL(`tel:${device.hotline}`);
    }
  };

  return (
    <View style={styles.container}>
      <FAppbar
        toolbarHeight={56}
        customizeTitle={
          <View style={styles.title}>
            <FText typo="bodyLabel02" color={colors.title} numberOfLines={1}>
              {device.name}
            </FText>
            <FText typo="body04" color={colors.subtitle} numberOfLines={1}>
              {t(`device.detail.${device.online ? 'online' : 'offline'}`, {
                location: device.location,
              })}
            </FText>
          </View>
        }
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
        trailing={
          <FIconButton
            icon={FOutlined.settings}
            size={24}
            iconColor={colors.title}
            onPress={() => settingsSheetRef.current?.present()}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + tokens.space.xl,
        }}>
        <View style={styles.viewer}>
          <PurifierViewer
            hotOn={hot.on}
            coldOn={cold.on}
            onSwitchChange={(ch, on) =>
              ch === 'hot' ? p.setHotOn(on) : p.setColdOn(on)
            }
          />
        </View>
        <WaterQualitySection tdsIn={device.tdsIn} tdsOut={device.tdsOut} />
        <FilterSection
          filters={device.filters}
          onBuy={fs =>
            navigation.navigate('BottomNavigation', {
              screen: 'Store',
              params: {skus: fs.map(f => f.sku)},
            })
          }
          onReplace={fs =>
            navigation.navigate('FilterReplace', {filterIds: fs.map(f => f.id)})
          }
        />
        <WaterModeSection
          hot={hot}
          cold={cold}
          ecoOn={eco.on}
          onOpen={channel => navigation.navigate('WaterMode', {channel})}
        />
        <EcoModeSection
          on={eco.on}
          range={eco.range}
          setOn={p.setEcoOn}
          setRange={p.setEcoRange}
        />
        <HistorySection />
        <ActionsSection onAction={onAction} />
      </ScrollView>

      <SettingsSheet
        ref={settingsSheetRef}
        device={device}
        onRename={p.rename}
        onRelocate={p.relocate}
        onDeleted={() => {
          showSnackbar(t('device.detail.deleted'), {type: 'success'});
          navigation.goBack();
        }}
      />
    </View>
  );
};

export default PurifierDetailScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    title: {
      flex: 1,
    },
    viewer: {
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.space.sm,
    },
  });
