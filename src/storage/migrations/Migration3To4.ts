import { storageKeys } from '../storageKeys';
import type { Migration } from './Migration';

export const migration3To4: Migration = {
  fromVersion: 3,
  toVersion: 4,
  keys: [storageKeys.lessonProgress],
  async migrate(storage) {
    // Progress creation is deliberately deferred to an explicit service call.
    const existing = await storage.getItem<unknown>(storageKeys.lessonProgress);
    if (existing !== null) await storage.setItem(storageKeys.lessonProgress, existing);
  },
};
