import { sampleOwner } from '../../src/development/seed/sampleData';
import { NotificationSettingsService } from '../../src/features/notifications/NotificationSettingsService';
import type { NotificationDeliveryStatus, NotificationScheduler } from '../../src/features/notifications/NotificationScheduler';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

class FakeScheduler implements NotificationScheduler {
  calls: Array<{ enabled: boolean; time: string }> = [];
  constructor(private readonly result: NotificationDeliveryStatus = 'scheduled') {}
  async apply(enabled: boolean, time: string): Promise<NotificationDeliveryStatus> { this.calls.push({ enabled, time }); return enabled ? this.result : 'disabled'; }
}

describe('NotificationSettingsService', () => {
  async function setup(result: NotificationDeliveryStatus = 'scheduled') {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    const scheduler = new FakeScheduler(result);
    const service = new NotificationSettingsService(new StorageTransactionManager(storage), scheduler, () => 'settings-1', () => '2026-07-22T01:00:00.000Z', () => 'Australia/Adelaide');
    return { repositories, scheduler, service };
  }

  it('creates disabled local-first defaults idempotently', async () => {
    const { repositories, service } = await setup();
    const first = await service.load(sampleOwner.id);
    const second = await service.load(sampleOwner.id);
    expect(first).toEqual(second);
    expect(first).toMatchObject({ enabled: false, dailyReminderEnabled: false, dailyReminderTime: '18:00', timezone: 'Australia/Adelaide' });
    await expect(repositories.notificationSettings.findAll()).resolves.toHaveLength(1);
  });

  it('persists a time and applies phone scheduling', async () => {
    const { repositories, scheduler, service } = await setup();
    const initial = await service.load(sampleOwner.id);
    const result = await service.setDailyReminder(initial, '08:00');
    expect(result).toMatchObject({ delivery: 'scheduled', settings: { enabled: true, dailyReminderEnabled: true, dailyReminderTime: '08:00' } });
    expect(scheduler.calls).toEqual([{ enabled: true, time: '08:00' }]);
    await expect(repositories.notificationSettings.findById(initial.id)).resolves.toEqual(result.settings);
  });

  it('disables delivery while preserving the last preferred time', async () => {
    const { scheduler, service } = await setup();
    const enabled = (await service.setDailyReminder(await service.load(sampleOwner.id), '12:00')).settings;
    const result = await service.setDailyReminder(enabled, null);
    expect(result).toMatchObject({ delivery: 'disabled', settings: { enabled: false, dailyReminderEnabled: false, dailyReminderTime: '12:00' } });
    expect(scheduler.calls[1]).toEqual({ enabled: false, time: '12:00' });
  });
});
