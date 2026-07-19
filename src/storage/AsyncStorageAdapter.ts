import AsyncStorage from '@react-native-async-storage/async-storage';

import type { StorageAdapter } from './StorageAdapter';

export class AsyncStorageAdapter implements StorageAdapter {
  async getItem<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value === null ? null : JSON.parse(value) as T;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
}
