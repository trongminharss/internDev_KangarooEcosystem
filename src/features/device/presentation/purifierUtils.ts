export type FilterStatus = 'good' | 'warning' | 'replace';

export interface PurifierFilter {
  id: string;
  sku: string;
  name: string;
  lifeMonths: number;
  remainingPercent: number;
  installedAt: string; // ISO-8601
  price: number;
}

export type HistoryRange = 1 | 7 | 30;
export type HistoryMetric = 'tds' | 'water' | 'power';

export const HOT_RANGE: [number, number] = [40, 90];
export const COLD_RANGE: [number, number] = [0, 15];
export const TEMP_STEP = 0.5;

export const filterStatus = (remainingPercent: number): FilterStatus =>
  remainingPercent <= 10
    ? 'replace'
    : remainingPercent <= 30
    ? 'warning'
    : 'good';

/** Snap a raw slider value to the 0.5° grid and keep it inside [min, max]. */
export const snapTemp = (value: number, [min, max]: [number, number]) =>
  Math.min(max, Math.max(min, Math.round(value / TEMP_STEP) * TEMP_STEP));

export const formatHour = (hour: number) =>
  `${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`;

/** Removal efficiency of the membrane: share of input TDS that is filtered out. */
export const filterEfficiency = (tdsIn: number, tdsOut: number) =>
  tdsIn > 0 ? Math.round(((tdsIn - tdsOut) / tdsIn) * 100) : 0;

// ponytail: deterministic mock series until the device telemetry API exists.
export const historySeries = (range: HistoryRange, metric: HistoryMetric) => {
  const points = range === 1 ? 12 : range;
  const base = {
    tds: 12,
    water: range === 1 ? 1.4 : 9,
    power: range === 1 ? 0.12 : 1.3,
  }[metric];
  return Array.from({length: points}, (_, i) => {
    const wave = Math.sin((i + range) * 1.7) * 0.35 + Math.cos(i * 0.9) * 0.15;
    return Math.round(base * (1 + wave) * 10) / 10;
  });
};

export type WaterChannelKey = 'hot' | 'cold';

/** Position of `value` inside [min, max] as 0..1 (clamped). */
export const rangeFraction = (value: number, [min, max]: [number, number]) =>
  Math.min(1, Math.max(0, (value - min) / (max - min)));

/** Blend two `#RRGGBB` colours; `t` = 0 gives `a`, 1 gives `b`. */
export const mixHex = (a: string, b: string, t: number) =>
  `#${[1, 3, 5]
    .map(i => {
      const x = parseInt(a.slice(i, i + 2), 16);
      const y = parseInt(b.slice(i, i + 2), 16);
      return Math.round(x + (y - x) * t)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;

/** Dots drawn in the TDS drop illustration: one per ~8 ppm, at least one when any. */
export const particleCount = (tds: number) =>
  tds <= 0 ? 0 : Math.min(28, Math.max(1, Math.round(tds / 8)));

export type TempMood =
  | 'veryHot'
  | 'hot'
  | 'warm'
  | 'mild'
  | 'icy'
  | 'chilled'
  | 'cool';

/** Plain-language feel of a set-point (an i18n key under `device.waterMode.mood`). */
export const tempMood = (channel: WaterChannelKey, temp: number): TempMood => {
  if (channel === 'hot') {
    if (temp >= 85) {
      return 'veryHot';
    }
    if (temp >= 70) {
      return 'hot';
    }
    if (temp >= 50) {
      return 'warm';
    }
    return 'mild';
  }
  if (temp <= 4) {
    return 'icy';
  }
  if (temp <= 8) {
    return 'chilled';
  }
  return 'cool';
};

/** Set-points outside the comfortable band get a caution note. */
export const isExtremeTemp = (channel: WaterChannelKey, temp: number) =>
  channel === 'hot' ? temp >= 80 : temp <= 4;

/** Point on a 24h dial (0h at the top, clockwise). */
export const dialPoint = (hour: number, r: number, c: number) => {
  const a = (hour / 24) * 2 * Math.PI - Math.PI / 2;
  return {x: c + r * Math.cos(a), y: c + r * Math.sin(a)};
};

/** SVG arc from `from` to `to` hours on a 24h dial of radius `r` centred at `c`. */
export const dialArc = (from: number, to: number, r: number, c: number) => {
  const span = (((to - from) % 24) + 24) % 24 || 24;
  if (span >= 24) {
    // A full circle cannot be one arc; draw two halves.
    const p = dialPoint(from, r, c);
    const q = dialPoint(from + 12, r, c);
    return `M${p.x} ${p.y} A${r} ${r} 0 1 1 ${q.x} ${q.y} A${r} ${r} 0 1 1 ${p.x} ${p.y}`;
  }
  const p = dialPoint(from, r, c);
  const q = dialPoint(from + span, r, c);
  return `M${p.x} ${p.y} A${r} ${r} 0 ${span > 12 ? 1 : 0} 1 ${q.x} ${q.y}`;
};

// ponytail: rough standby draw of the hot/cold blocks; replace with telemetry.
export const ecoSavingKwh = (activeHours: number) =>
  Math.round((24 - activeHours) * 0.06 * 30 * 10) / 10;
