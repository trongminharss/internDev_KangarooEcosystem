import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {RangeSlider} from '@react-native-assets/slider';
import Svg, {Circle, Path} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {ColorsProps, useTheme} from '@/core/theme';
import {FDate} from '@/core/utils/date';
import {FIcon, FSwitch, FText} from '@/shared/components';
import {FOutlined, tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';
import {dialArc, dialPoint, ecoSavingKwh, formatHour} from '../purifierUtils';

interface Props {
  on: boolean;
  range: [number, number];
  setOn: (on: boolean) => void;
  setRange: (r: [number, number]) => void;
}

const DIAL = 148;
const C = DIAL / 2;
const R = 60;
const STROKE = 12;
const ICON = 22;

export const EcoModeSection: React.FC<Props> = ({
  on,
  range,
  setOn,
  setRange,
}) => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const s = useMemo(() => createStyles(colors), [colors]);
  const [start, end] = range;
  const activeHours = on ? end - start : 24;
  const now = FDate.hourOfDay();
  const nowDot = dialPoint(now, R, C);
  const running = !on || (now >= start && now < end);
  const sun = dialPoint(on ? (start + end) / 2 : 12, R, C);
  const moon = dialPoint((end + 24 + start) / 2, R, C);

  return (
    <DeviceSection title={t('device.eco.title')}>
      <View style={s.top}>
        <View style={s.flex}>
          <FText typo="bodyLabel03" color={colors.title}>
            {t(`device.eco.${on ? 'on' : 'off'}`)}
          </FText>
          <FText typo="body04" color={colors.subtitle}>
            {t(`device.eco.${on ? 'descOn' : 'descOff'}`)}
          </FText>
        </View>
        <FSwitch status={on} onChange={setOn} />
      </View>

      <View style={s.dialRow}>
        <View style={s.dial}>
          <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
            <Circle
              cx={C}
              cy={C}
              r={R}
              stroke={on ? colors.infoBackground : colors.grey1}
              strokeWidth={STROKE}
              fill="none"
            />
            <Path
              d={dialArc(on ? start : 0, on ? end : 24, R, C)}
              stroke={on ? colors.primary : colors.grey2}
              strokeWidth={STROKE}
              strokeLinecap={on ? 'round' : 'butt'}
              fill="none"
            />
            {[0, 6, 12, 18].map(h => {
              const p = dialPoint(h, R - STROKE - 4, C);
              const q = dialPoint(h, R - STROKE, C);
              return (
                <Path
                  key={h}
                  d={`M${p.x} ${p.y} L${q.x} ${q.y}`}
                  stroke={colors.grey2}
                  strokeWidth={2}
                />
              );
            })}
            <Circle
              cx={nowDot.x}
              cy={nowDot.y}
              r={5}
              fill={colors.white}
              stroke={colors.warningNormal}
              strokeWidth={3}
            />
          </Svg>
          <View
            style={[s.badge, {left: sun.x - ICON / 2, top: sun.y - ICON / 2}]}>
            <FIcon
              icon={FOutlined.flash_on}
              size={14}
              iconColor={on ? colors.onDarkPrimary : colors.subtitle}
            />
          </View>
          {on && (
            <View
              style={[
                s.badge,
                {left: moon.x - ICON / 2, top: moon.y - ICON / 2},
              ]}>
              <FIcon
                icon={FOutlined.moon_stars}
                size={14}
                iconColor={colors.warningNormal}
              />
            </View>
          )}
          <View style={s.center}>
            <FText typo="headline7" color={colors.title}>
              {String(activeHours).replace('.', ',')}h
            </FText>
            <FText typo="body05" color={colors.subtitle}>
              {t('device.eco.active')}
            </FText>
          </View>
        </View>

        <View style={s.facts}>
          {[
            {
              icon: FOutlined.flash_on,
              label: t('device.eco.runFrom'),
              value: on ? formatHour(start) : '00:00',
            },
            {
              icon: FOutlined.moon_stars,
              label: t('device.eco.restFrom'),
              value: on ? formatHour(end) : t('device.eco.noRest'),
            },
          ].map(f => (
            <View key={f.label} style={s.fact}>
              <FIcon icon={f.icon} size={18} iconColor={colors.subtitle} />
              <View>
                <FText typo="body05" color={colors.subtitle}>
                  {f.label}
                </FText>
                <FText typo="bodyLabel03" color={colors.title}>
                  {f.value}
                </FText>
              </View>
            </View>
          ))}
          <View
            style={[
              s.saving,
              on && {backgroundColor: colors.primaryBackground},
            ]}>
            <FText typo="body05" color={colors.subtitle}>
              {t('device.eco.saving')}
            </FText>
            <FText
              typo="bodyLabel03"
              color={on ? colors.primary : colors.subtitle}>
              {t('device.eco.savingValue', {
                kwh: String(ecoSavingKwh(activeHours)).replace('.', ','),
              })}
            </FText>
          </View>
          <FText typo="body05" color={colors.subtitle}>
            {t(`device.eco.${running ? 'running' : 'resting'}`)}
          </FText>
        </View>
      </View>

      <RangeSlider
        range={range}
        minimumValue={0}
        maximumValue={24}
        step={0.5}
        minimumRange={1}
        crossingAllowed={false}
        enabled={on}
        onValueChange={setRange}
        inboundColor={on ? colors.primary : colors.disable}
        outboundColor={colors.grey1}
        thumbTintColor={colors.white}
        thumbStyle={[
          s.thumb,
          {borderColor: on ? colors.primary : colors.disable},
        ]}
        trackHeight={6}
        thumbSize={24}
      />
      <View style={s.ticks}>
        {[0, 6, 12, 18, 24].map(h => (
          <FText key={h} typo="body05" color={colors.subtitle}>
            {formatHour(h)}
          </FText>
        ))}
      </View>
    </DeviceSection>
  );
};

export default EcoModeSection;

const createStyles = (colors: ColorsProps) =>
  StyleSheet.create({
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.xs,
    },
    flex: {
      flex: 1,
      gap: tokens.spacing._3xs,
    },
    dialRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing.s,
    },
    dial: {
      width: DIAL,
      height: DIAL,
    },
    badge: {
      position: 'absolute',
      width: ICON,
      height: ICON,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    facts: {
      flex: 1,
      gap: tokens.spacing._2xs,
    },
    fact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: tokens.spacing._2xs,
    },
    saving: {
      padding: tokens.spacing._2xs,
      borderRadius: tokens.borderRadius.small,
      backgroundColor: colors.grey1,
    },
    thumb: {
      borderWidth: 2,
    },
    ticks: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
