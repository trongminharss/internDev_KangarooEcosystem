import FTheme from '@/core/theme/FTheme';
import {DarkTheme} from '@/core/theme/DarkTheme';

const KEYS = [
  'background',
  'indicator',
  'iconActive',
  'iconInactive',
  'border',
] as const;

describe('tabBar theme tokens', () => {
  it.each(KEYS)('FTheme.colors.tabBar.%s is a non-empty string', key => {
    expect(typeof FTheme.colors.tabBar[key]).toBe('string');
    expect(FTheme.colors.tabBar[key].length).toBeGreaterThan(0);
  });

  it.each(KEYS)('DarkTheme.colors.tabBar.%s is a non-empty string', key => {
    expect(typeof DarkTheme.colors.tabBar[key]).toBe('string');
    expect(DarkTheme.colors.tabBar[key].length).toBeGreaterThan(0);
  });

  it('light and dark indicator differ', () => {
    expect(FTheme.colors.tabBar.indicator).not.toBe(
      DarkTheme.colors.tabBar.indicator,
    );
  });
});
