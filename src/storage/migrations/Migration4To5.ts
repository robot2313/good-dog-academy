import { storageKeys } from '../storageKeys';
import type { Migration } from './Migration';

export const migration4To5: Migration = {
  fromVersion: 4,
  toVersion: 5,
  keys: [storageKeys.dailyPlans],
  async migrate(storage) {
    const stored = await storage.getItem<unknown>(storageKeys.dailyPlans);
    if (stored === null) return;
    if (!Array.isArray(stored)) throw new Error('DailyPlan storage must be an array.');

    // Version 4 plans were presentation-only drafts. They lack ownership,
    // assessment provenance, timezone, budgets, and typed items, so fabricating
    // those values would make them appear trustworthy. Version 5 deliberately
    // retires those pre-production drafts; the engine regenerates today's plan.
    await storage.setItem(storageKeys.dailyPlans, []);
  },
};
