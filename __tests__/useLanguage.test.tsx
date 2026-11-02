import 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn().mockResolvedValue(undefined),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import renderer from 'react-test-renderer';
import i18next, {isLanguageCode} from '@/core/i18n';
import {useLanguage} from '@/core/i18n/useLanguage';

let captured: ReturnType<typeof useLanguage> | null = null;

const Probe = () => {
  captured = useLanguage();
  return null;
};

describe('isLanguageCode', () => {
  it('accepts supported codes', () => {
    expect(isLanguageCode('vi')).toBe(true);
    expect(isLanguageCode('en')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isLanguageCode('fr')).toBe(false);
    expect(isLanguageCode(null)).toBe(false);
    expect(isLanguageCode(undefined)).toBe(false);
  });
});

describe('useLanguage', () => {
  beforeEach(() => {
    captured = null;
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    return i18next.changeLanguage('vi');
  });

  it('defaults to vi', async () => {
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    expect(captured?.language).toBe('vi');
  });

  it('changes language and persists on setLanguage', async () => {
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    await renderer.act(async () => {
      captured?.setLanguage('en');
    });
    expect(captured?.language).toBe('en');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('language', '"en"');
  });

  it('still switches language when persistence fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
      new Error('io error'),
    );
    await renderer.act(async () => {
      renderer.create(<Probe />);
    });
    await renderer.act(async () => {
      captured?.setLanguage('en');
    });
    expect(captured?.language).toBe('en');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
