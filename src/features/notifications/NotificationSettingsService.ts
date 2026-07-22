import type { NotificationSettings } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import type { NotificationDeliveryStatus, NotificationScheduler } from './NotificationScheduler';

const keys = [storageKeys.owners, storageKeys.notificationSettings] as const;

export class NotificationSettingsService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly scheduler: NotificationScheduler,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
    private readonly timezone: () => string,
  ) {}

  async load(ownerId: string): Promise<NotificationSettings> {
    return this.transactions.run(keys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      const owner = await repositories.owners.findById(ownerId);
      if (!owner) throw new Error('Owner not found.');
      const existing = (await repositories.notificationSettings.findAll()).find((item) => item.ownerId === ownerId);
      if (existing) return existing;
      const created: NotificationSettings = { id: this.createId('notification-settings'), ownerId, enabled: false, dailyReminderEnabled: false, dailyReminderTime: '18:00', timezone: this.timezone(), weeklySummaryEnabled: false, updatedAt: this.now() };
      await repositories.notificationSettings.save(created);
      return created;
    });
  }

  async setDailyReminder(settings: NotificationSettings, time: string | null): Promise<{ settings: NotificationSettings; delivery: NotificationDeliveryStatus }> {
    const updated = await this.transactions.run(keys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      const owner = await repositories.owners.findById(settings.ownerId);
      if (!owner) throw new Error('Owner not found.');
      const next: NotificationSettings = { ...settings, enabled: time !== null, dailyReminderEnabled: time !== null, dailyReminderTime: time ?? settings.dailyReminderTime, updatedAt: this.now() };
      await repositories.notificationSettings.save(next);
      return next;
    });
    return { settings: updated, delivery: await this.scheduler.apply(updated.enabled && updated.dailyReminderEnabled, updated.dailyReminderTime) };
  }
}
