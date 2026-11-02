import {
  COLD_RANGE,
  dialArc,
  dialPoint,
  ecoSavingKwh,
  HOT_RANGE,
  filterEfficiency,
  filterStatus,
  formatHour,
  historySeries,
  isExtremeTemp,
  mixHex,
  particleCount,
  rangeFraction,
  snapTemp,
  tempMood,
} from '@/features/device/presentation/purifierUtils';

describe('purifierUtils', () => {
  it('classifies filter life', () => {
    expect(filterStatus(8)).toBe('replace');
    expect(filterStatus(10)).toBe('replace');
    expect(filterStatus(24)).toBe('warning');
    expect(filterStatus(31)).toBe('good');
  });

  it('snaps temperatures to 0.5 steps inside the channel range', () => {
    expect(snapTemp(80.26, HOT_RANGE)).toBe(80.5);
    expect(snapTemp(80.24, HOT_RANGE)).toBe(80);
    expect(snapTemp(99, HOT_RANGE)).toBe(90);
    expect(snapTemp(-3, COLD_RANGE)).toBe(0);
  });

  it('formats half-hours', () => {
    expect(formatHour(6)).toBe('06:00');
    expect(formatHour(21.5)).toBe('21:30');
  });

  it('computes removal efficiency', () => {
    expect(filterEfficiency(186, 9)).toBe(95);
    expect(filterEfficiency(0, 0)).toBe(0);
  });

  it('returns one point per bucket', () => {
    expect(historySeries(1, 'tds')).toHaveLength(12);
    expect(historySeries(7, 'water')).toHaveLength(7);
    expect(historySeries(30, 'power')).toHaveLength(30);
  });

  it('maps a temperature to its 0..1 position on the scale', () => {
    expect(rangeFraction(65, HOT_RANGE)).toBe(0.5);
    expect(rangeFraction(100, HOT_RANGE)).toBe(1);
    expect(rangeFraction(-2, COLD_RANGE)).toBe(0);
  });

  it('blends hex colours', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ff0080', 0.5)).toBe('#800040');
  });

  it('scales TDS particles and caps them', () => {
    expect(particleCount(0)).toBe(0);
    expect(particleCount(3)).toBe(1);
    expect(particleCount(186)).toBe(23);
    expect(particleCount(900)).toBe(28);
  });

  it('describes and flags set-points', () => {
    expect(tempMood('hot', 90)).toBe('veryHot');
    expect(tempMood('hot', 40)).toBe('mild');
    expect(tempMood('cold', 4)).toBe('icy');
    expect(tempMood('cold', 12)).toBe('cool');
    expect(isExtremeTemp('hot', 80)).toBe(true);
    expect(isExtremeTemp('hot', 79.5)).toBe(false);
    expect(isExtremeTemp('cold', 4)).toBe(true);
  });

  it('places hours on a 24h dial', () => {
    const top = dialPoint(0, 10, 50);
    expect(top.x).toBeCloseTo(50);
    expect(top.y).toBeCloseTo(40);
    const right = dialPoint(6, 10, 50);
    expect(right.x).toBeCloseTo(60);
    expect(dialArc(6, 22, 10, 50)).toContain(' 0 1 1 ');
    expect(dialArc(22, 6, 10, 50)).toContain(' 0 0 1 ');
  });

  it('estimates eco savings from idle hours', () => {
    expect(ecoSavingKwh(24)).toBe(0);
    expect(ecoSavingKwh(16)).toBe(14.4);
  });
});
