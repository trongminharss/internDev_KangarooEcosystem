import {
  isThemeMode,
  resolveIsDark,
  resolveTheme,
} from '@/core/theme/themeUtils';

describe('isThemeMode', () => {
  it('accepts valid modes', () => {
    expect(isThemeMode('light')).toBe(true);
    expect(isThemeMode('dark')).toBe(true);
    expect(isThemeMode('system')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isThemeMode(null)).toBe(false);
    expect(isThemeMode(undefined)).toBe(false);
    expect(isThemeMode('blue')).toBe(false);
    expect(isThemeMode(1)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('dark mode always returns dark theme', () => {
    expect(resolveTheme('dark', 'light').dark).toBe(true);
    expect(resolveTheme('dark', 'dark').dark).toBe(true);
  });

  it('light mode always returns light theme', () => {
    expect(resolveTheme('light', 'dark').dark).toBe(false);
    expect(resolveTheme('light', 'light').dark).toBe(false);
  });

  it('system mode follows the scheme', () => {
    expect(resolveTheme('system', 'dark').dark).toBe(true);
    expect(resolveTheme('system', 'light').dark).toBe(false);
    expect(resolveTheme('system', null).dark).toBe(false);
  });
});

describe('resolveIsDark', () => {
  it('returns the same result as resolveTheme.dark', () => {
    expect(resolveIsDark('dark', 'light')).toBe(true);
    expect(resolveIsDark('light', 'dark')).toBe(false);
    expect(resolveIsDark('system', 'dark')).toBe(true);
    expect(resolveIsDark('system', 'light')).toBe(false);
    expect(resolveIsDark('system', null)).toBe(false);
  });
});
