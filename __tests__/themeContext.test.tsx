import 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import renderer from 'react-test-renderer';
import {ThemeProvider, useTheme} from '@/core/theme';

let captured: ReturnType<typeof useTheme> | null = null;

const Probe = () => {
  captured = useTheme();
  return null;
};

const renderProbe = (props: {theme?: any} = {}) =>
  renderer.create(
    <ThemeProvider {...props}>
      <Probe />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  beforeEach(() => {
    captured = null;
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('defaults to system mode when nothing is stored', async () => {
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('system');
  });

  it('hydrates stored mode from AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('"dark"');
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('dark');
    expect(captured?.isDark).toBe(true);
  });

  it('falls back to system mode on invalid stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('"blue"');
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('system');
  });

  it('persists the new mode when setMode is called', async () => {
    await renderer.act(async () => {
      renderProbe();
    });
    await renderer.act(async () => {
      captured?.setMode('light');
    });
    expect(captured?.mode).toBe('light');
    expect(captured?.isDark).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', '"light"');
  });

  it('supports a fixed theme override', async () => {
    const {FTheme} = require('@/core/theme');
    await renderer.act(async () => {
      renderProbe({theme: FTheme});
    });
    expect(captured?.isDark).toBe(false);
  });

  it('falls back to system mode when storage read fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
      new Error('io error'),
    );
    await renderer.act(async () => {
      renderProbe();
    });
    expect(captured?.mode).toBe('system');
    expect(captured?.isDark).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('still switches the theme when persistence fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
      new Error('io error'),
    );
    await renderer.act(async () => {
      renderProbe();
    });
    await renderer.act(async () => {
      captured?.setMode('dark');
    });
    expect(captured?.mode).toBe('dark');
    expect(captured?.isDark).toBe(true);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('theme_mode', '"dark"');
    errorSpy.mockRestore();
  });
});
