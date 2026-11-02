import React, {useMemo, useState} from 'react';
import {LayoutChangeEvent, StyleSheet, View} from 'react-native';
import Svg, {Rect} from 'react-native-svg';
import {useTranslation} from 'react-i18next';
import {useTheme} from '@/core/theme';
import {FText} from '@/shared/components';
import {tokens} from '@/shared/styles';
import {DeviceSection} from './DeviceSection';
import {Segmented} from './Chip';
import {HistoryMetric, HistoryRange, historySeries} from '../purifierUtils';

const RANGES: HistoryRange[] = [1, 7, 30];

const UNITS: Record<HistoryMetric, string> = {
  tds: 'ppm',
  water: 'L',
  power: 'kWh',
};

const CHART_H = 140;

export const HistorySection: React.FC = () => {
  const {theme} = useTheme();
  const {colors} = theme;
  const {t} = useTranslation();
  const [range, setRange] = useState<HistoryRange>(7);
  const [metric, setMetric] = useState<HistoryMetric>('tds');
  const [width, setWidth] = useState(0);

  const data = useMemo(() => historySeries(range, metric), [range, metric]);
  const max = Math.max(...data);
  const total = data.reduce((a, b) => a + b, 0);
  const summary = metric === 'tds' ? total / data.length : total;
  const gap = range === 30 ? 2 : 6;
  const barW = width ? (width - gap * (data.length - 1)) / data.length : 0;

  const metrics = (Object.keys(UNITS) as HistoryMetric[]).map(key => ({
    key,
    label: t(`device.history.metric.${key}`),
  }));
  const ranges = RANGES.map(key => ({
    key,
    label: t('device.history.days', {count: key}),
  }));

  return (
    <DeviceSection title={t('device.history.title')}>
      <Segmented items={metrics} value={metric} onChange={setMetric} />

      <View style={styles.summary}>
        <FText typo="headline5" color={colors.title}>
          {summary.toFixed(1)}
        </FText>
        <FText typo="body03" color={colors.subtitle}>
          {UNITS[metric]}{' '}
          {t(`device.history.${metric === 'tds' ? 'average' : 'total'}`)}
        </FText>
      </View>

      <View
        style={{height: CHART_H}}
        onLayout={(e: LayoutChangeEvent) =>
          setWidth(e.nativeEvent.layout.width)
        }>
        {width > 0 && (
          <Svg width={width} height={CHART_H}>
            {data.map((v, i) => {
              const h = Math.max(2, (v / max) * (CHART_H - 8));
              return (
                <Rect
                  key={i}
                  x={i * (barW + gap)}
                  y={CHART_H - h}
                  width={barW}
                  height={h}
                  rx={Math.min(4, barW / 2)}
                  fill={
                    i === data.length - 1
                      ? colors.primary
                      : colors.primaryBorder
                  }
                />
              );
            })}
          </Svg>
        )}
      </View>
      <View style={styles.axis}>
        <FText typo="body05" color={colors.subtitle}>
          {range === 1
            ? t('device.history.hoursAgo')
            : t('device.history.daysAgo', {count: range})}
        </FText>
        <FText typo="body05" color={colors.subtitle}>
          {t('device.history.now')}
        </FText>
      </View>

      <Segmented items={ranges} value={range} onChange={setRange} />
    </DeviceSection>
  );
};

export default HistorySection;

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: tokens.spacing._2xs,
  },
  axis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
