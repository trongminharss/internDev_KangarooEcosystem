import React, {useMemo, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FDate} from '@/core/utils/date';
import {
  FBottomSheet,
  FBottomSheetRef,
  FButton,
  FIcon,
  FText,
} from '@/shared/components';
import {FFilled, FOutlined, tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';
import {FilterCartridge} from './FilterCartridge';
import {FilterStatus, PurifierFilter, filterStatus} from '../purifierUtils';

interface Props {
  filters: PurifierFilter[];
  onBuy: (filters: PurifierFilter[]) => void;
  onReplace: (filters: PurifierFilter[]) => void;
}

const statusColor = (c: ColorsProps, s: FilterStatus) =>
  s === 'good' ? c.primary : s === 'warning' ? c.warning : c.error;

const Bar: React.FC<{percent: number; color: string; track: string}> = ({
  percent,
  color,
  track,
}) => (
  <View style={[barStyles.track, {backgroundColor: track}]}>
    <View
      style={[barStyles.fill, {width: `${percent}%`, backgroundColor: color}]}
    />
  </View>
);

const barStyles = StyleSheet.create({
  track: {
    height: 10,
    borderRadius: tokens.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 10,
  },
});

export const FilterSection: React.FC<Props> = ({filters, onBuy, onReplace}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<PurifierFilter | null>(null);
  const sheetRef = useRef<FBottomSheetRef>(null);

  const open = (f: PurifierFilter) => {
    setSelected(f);
    sheetRef.current?.present();
  };

  const close = () => {
    sheetRef.current?.dismiss();
    setSelected(null);
  };

  const due = filters.filter(f => filterStatus(f.remainingPercent) !== 'good');
  const sel = selected && filterStatus(selected.remainingPercent);

  return (
    <DeviceSection
      title={t('device.filter.title')}
      right={
        due.length > 0 ? (
          <FText typo="bodyLabel04" color={colors.error}>
            {t('device.filter.due', {count: due.length})}
          </FText>
        ) : undefined
      }>
      <View style={styles.rack}>
        {filters.map((f, i) => (
          <FilterCartridge
            key={f.id}
            index={i}
            code={f.sku.replace('KG-', '')}
            percent={f.remainingPercent}
            color={statusColor(colors, filterStatus(f.remainingPercent))}
            onPress={() => open(f)}
          />
        ))}
      </View>
      <FText typo="body04" color={colors.subtitle}>
        {t('device.filter.hint')}
      </FText>

      <View style={styles.actions}>
        <FButton
          kind="primary"
          color="success"
          style={styles.action}
          onPress={() => onBuy(due.length ? due : filters)}>
          <FButton.Icon icon={FOutlined.shopping_cart} size={20} />
          <FButton.Label>{t('device.filter.buy')}</FButton.Label>
        </FButton>
        <FButton
          kind="secondary"
          color="success"
          style={styles.action}
          onPress={() => onReplace(due)}>
          <FButton.Icon icon={FOutlined.tool_hand} size={20} />
          <FButton.Label>{t('device.filter.replace')}</FButton.Label>
        </FButton>
      </View>

      <FBottomSheet
        ref={sheetRef}
        onClose={() => setSelected(null)}
        snapPoints={['60%']}
        enableDynamicSizing={false}>
        {selected && sel && (
          <View
            style={[
              styles.sheetBody,
              {paddingBottom: insets.bottom + tokens.spacing.s},
            ]}>
            <FText typo="headline7" color={colors.title}>
              {selected.name}
            </FText>
            <View style={styles.bigRow}>
              <FText typo="headline3" color={statusColor(colors, sel)}>
                {selected.remainingPercent}%
              </FText>
              <FText typo="body03" color={colors.subtitle}>
                {t('device.filter.remaining')}
              </FText>
            </View>
            <Bar
              percent={selected.remainingPercent}
              color={statusColor(colors, sel)}
              track={colors.grey1}
            />

            {sel !== 'good' && (
              <View
                style={[
                  styles.alert,
                  {
                    backgroundColor:
                      sel === 'replace'
                        ? colors.errorBackground
                        : colors.warningBackground,
                  },
                ]}>
                <FIcon
                  icon={FFilled.c_warning}
                  size={20}
                  iconColor={statusColor(colors, sel)}
                />
                <FText typo="body03" color={colors.title} style={styles.flex}>
                  {sel === 'replace'
                    ? t('device.filter.alertReplace')
                    : t('device.filter.alertWarning')}
                </FText>
              </View>
            )}

            <View style={styles.specs}>
              {[
                [
                  t('device.filter.statusLabel'),
                  t(`device.filter.status.${sel}`),
                ],
                [
                  t('device.filter.life'),
                  t('device.filter.lifeValue', {count: selected.lifeMonths}),
                ],
                [t('device.filter.installed'), FDate.dMy(selected.installedAt)],
                [
                  t('device.filter.replaceAt'),
                  FDate.addMonthsDMy(selected.installedAt, selected.lifeMonths),
                ],
                [t('device.filter.sku'), selected.sku],
              ].map(([k, v]) => (
                <View key={k} style={styles.spec}>
                  <FText typo="body03" color={colors.subtitle}>
                    {k}
                  </FText>
                  <FText typo="bodyLabel03" color={colors.title}>
                    {v}
                  </FText>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <FButton
                kind="tertiary"
                color="success"
                style={styles.action}
                title={t('device.filter.buyOne')}
                onPress={() => {
                  close();
                  onBuy([selected]);
                }}
              />
              <FButton
                kind="primary"
                color="success"
                style={styles.action}
                title={t('device.filter.replaceOne')}
                onPress={() => {
                  close();
                  onReplace([selected]);
                }}
              />
            </View>
          </View>
        )}
      </FBottomSheet>
    </DeviceSection>
  );
};

export default FilterSection;

const createStyles = (_colors: ColorsProps) =>
  StyleSheet.create({
    rack: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    actions: {
      flexDirection: 'row',
      gap: tokens.spacing._2xs,
      marginTop: tokens.spacing._3xs,
    },
    action: {
      flex: 1,
    },
    sheetBody: {
      width: '100%',
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.spacing._2xs,
      gap: tokens.spacing.xs,
    },
    bigRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: tokens.spacing._2xs,
    },
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
      padding: tokens.spacing.xs,
      borderRadius: tokens.borderRadius.small,
    },
    flex: {
      flex: 1,
    },
    specs: {
      gap: tokens.spacing._2xs,
    },
    spec: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
