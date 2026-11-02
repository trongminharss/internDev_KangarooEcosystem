import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS} from '../constants/storageKeys';

export const Storage = {
  ...STORAGE_KEYS,

  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const result = await AsyncStorage.getItem(key);
      if (result !== null) {
        return JSON.parse(result) as T;
      }
      return null;
    } catch (e) {
      console.error(`[Storage] Error getting key ${key}:`, e);
      throw e;
    }
  },

  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const item = JSON.stringify(value);
      await AsyncStorage.setItem(key, item);
    } catch (e) {
      console.error(`[Storage] Error setting key ${key}:`, e);
      throw e;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error(`[Storage] Error removing key ${key}:`, e);
      throw e;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('[Storage] Error clearing storage:', e);
      throw e;
    }
  },
};

export default Storage;
