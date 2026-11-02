import React, {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FDate} from '@/core/utils/date';
import {FAppbar, FButton, FCheckbox, FIcon, FText} from '@/shared/components';
import {FFilled, tokens} from '@/shared/styles';
import {RootStackParamList, useAppNavigation} from '@/app/navigation/types';
import {useFSnackbar} from '@/shared/hooks/useSnackbar';
import {PURIFIER_MOCK} from '../purifierMock';
import {Chip} from '../components/Chip';

const SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];
const PERKS = ['genuine', 'technician', 'reset'];

const vnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export const FilterReplaceScreen: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  const {showSnackbar} = useFSnackbar();
  const {params} = useRoute<RouteProp<RootStackParamList, 'FilterReplace'>>();
  const days = useMemo(() => FDate.upcomingDays(7), []);

  const [picked, setPicked] = useState<string[]>(
    params.filterIds.length
      ? params.filterIds
      : PURIFIER_MOCK.filters.map(f => f.id),
  );
  const [day, setDay] = useState(days[0].iso);
  const [slot, setSlot] = useState(SLOTS[0]);

  const chosen = PURIFIER_MOCK.filters.filter(f => picked.includes(f.id));
  const total = chosen.reduce((s, f) => s + f.price, 0);
  const toggle = (id: string) =>
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  return (
    <View style={styles.container}>
      <FAppbar
        title={t('device.replace.title')}
        onBack={navigation.goBack}
        showLanguage={false}
        showLanguageSelector={false}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {PERKS.map(p => (
            <View key={p} style={styles.perk}>
              <FIcon
                icon={FFilled.c_check}
                size={18}
                iconColor={colors.primary}
              />
              <FText typo="body03" color={colors.title}>
                {t(`device.replace.perks.${p}`)}
              </FText>
            </View>
          ))}
        </View>

        <FText typo="headline8" color={colors.title}>
          {t('device.replace.pick')}
        </FText>
        <View style={styles.card}>
          {PURIFIER_MOCK.filters.map(f => (
            <FCheckbox
              key={f.id}
              checked={picked.includes(f.id)}
              onPress={() => toggle(f.id)}
              style={styles.filterRow}>
              <View style={styles.filterText}>
                <FText typo="bodyLabel03" color={colors.title}>
                  {f.name}
                </FText>
                <FText typo="body04" color={colors.subtitle}>
                  {t('device.replace.remaining', {percent: f.remainingPercent})}
                </FText>
              </View>
              <FText typo="bodyLabel03" color={colors.title}>
                {vnd(f.price)}
              </FText>
            </FCheckbox>
          ))}
        </View>

        <FText typo="headline8" color={colors.title}>
          {t('device.replace.day')}
        </FText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}>
          {days.map(d => (
            <Chip
              key={d.iso}
              caption={t(`device.replace.weekday.${d.weekday}`)}
              label={d.dM}
              active={day === d.iso}
              onPress={() => setDay(d.iso)}
              idleColor={colors.white}
            />
          ))}
        </ScrollView>

        <FText typo="headline8" color={colors.title}>
          {t('device.replace.slot')}
        </FText>
        <View style={[styles.row, styles.wrap]}>
          {SLOTS.map(s => (
            <Chip
              key={s}
              label={s}
              active={slot === s}
              onPress={() => setSlot(s)}
              idleColor={colors.white}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {paddingBottom: insets.bottom + tokens.spacing.xs},
        ]}>
        <View style={styles.flex}>
          <FText typo="body04" color={colors.subtitle}>
            {t('device.replace.summary', {count: chosen.length})}
          </FText>
          <FText typo="headline6" color={colors.title}>
            {vnd(total)}
          </FText>
        </View>
        <FButton
          title={t('device.replace.book')}
          disabled={!chosen.length}
          onPress={() => {
            showSnackbar(
              t('device.replace.booked', {
                count: chosen.length,
                slot,
                date: FDate.dMy(day),
              }),
              {type: 'success'},
            );
            navigation.goBack();
          }}
        />
      </View>
    </View>
  );
};

export default FilterReplaceScreen;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: tokens.space.md,
      gap: tokens.spacing.xs,
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: tokens.borderRadius.medium,
      padding: tokens.spacing.s,
      gap: tokens.spacing.xs,
    },
    perk: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
    },
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterText: {
      flex: 1,
      marginLeft: tokens.spacing._2xs,
    },
    row: {
      flexDirection: 'row',
      gap: tokens.spacing._2xs,
    },
    wrap: {
      flexWrap: 'wrap',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
      paddingHorizontal: tokens.space.md,
      paddingTop: tokens.spacing.xs,
      backgroundColor: colors.white,
      borderTopWidth: 1,
      borderTopColor: colors.border1,
    },
    flex: {
      flex: 1,
    },
  });
