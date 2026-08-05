import type { User } from '@supabase/supabase-js';

import type { DomainRepositories, Repository } from '../../src/domain/repositories';
import { CloudSyncService } from '../../src/services/cloud/CloudSyncService';
import type { Tables } from '../../src/services/cloud/database.types';
import { getSupabaseClient } from '../../src/services/cloud/supabaseClient';

jest.mock('../../src/services/cloud/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

class MemoryRepository<T extends { id: string }> implements Repository<T> {
  readonly records = new Map<string, T>();

  constructor(initial: readonly T[] = []) {
    initial.forEach((item) => this.records.set(item.id, item));
  }

  async findById(id: string): Promise<T | null> { return this.records.get(id) ?? null; }
  async findAll(): Promise<T[]> { return [...this.records.values()]; }
  async save(entity: T): Promise<void> { this.records.set(entity.id, entity); }
  async remove(id: string): Promise<void> { this.records.delete(id); }
  async clear(): Promise<void> { this.records.clear(); }
}

function createRepositories(dogs: readonly { id: string; updatedAt: string; photoUri?: string }[] = []) {
  const empty = () => new MemoryRepository<{ id: string }>();
  const dogRepository = new MemoryRepository(dogs);
  const repositories = {
    owners: empty(), dogs: dogRepository, behaviourProfiles: empty(), behaviourAssessments: empty(),
    lessonProgress: empty(), dailyPlans: empty(), trainingSessions: empty(), achievements: empty(),
    progress: empty(), notificationSettings: empty(), troubleshooterAttempts: empty(),
  } as unknown as DomainRepositories;
  return { dogRepository, repositories };
}

function cloudDog(updatedAt: string): Tables<'cloud_records'> {
  return {
    household_id: 'house-1', entity_type: 'dog', record_id: 'dog-1', dog_id: 'dog-1',
    payload: { id: 'dog-1', name: 'Pepper', updatedAt }, local_updated_at: updatedAt,
    updated_by: 'user-2', version: 2, deleted_at: null, created_at: updatedAt, updated_at: updatedAt,
  };
}

function clientFor(remote: readonly Tables<'cloud_records'>[]) {
  const upsert = jest.fn().mockResolvedValue({ error: null });
  const eq = jest.fn().mockResolvedValue({ data: remote, error: null });
  const select = jest.fn().mockReturnValue({ eq });
  mockGetSupabaseClient.mockReturnValue({ from: jest.fn().mockReturnValue({ select, upsert }) } as never);
  return { upsert };
}

describe('CloudSyncService', () => {
  const user = { id: 'user-1' } as User;

  it('pulls a newer shared dog record while preserving this phone\'s private photo', async () => {
    const { dogRepository, repositories } = createRepositories([
      { id: 'dog-1', updatedAt: '2026-08-01T00:00:00.000Z', photoUri: 'file:///private/pepper.jpg' },
    ]);
    const { upsert } = clientFor([cloudDog('2026-08-02T00:00:00.000Z')]);

    const result = await new CloudSyncService(repositories).sync('house-1', user, 'viewer');

    expect(result).toEqual({ pushed: 0, pulled: 1 });
    expect((await dogRepository.findById('dog-1'))?.photoUri).toBe('file:///private/pepper.jpg');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('does not upload unrelated records that existed before this device joined', async () => {
    const { repositories } = createRepositories([{ id: 'dog-old', updatedAt: '2026-08-01T00:00:00.000Z' }]);
    const { upsert } = clientFor([]);

    const result = await new CloudSyncService(repositories).sync(
      'house-1', user, 'trainer', '2026-08-05T00:00:00.000Z',
    );

    expect(result).toEqual({ pushed: 0, pulled: 0 });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('uploads new training data created after Team Dog was connected', async () => {
    const { repositories } = createRepositories([{ id: 'dog-new', updatedAt: '2026-08-06T00:00:00.000Z' }]);
    const { upsert } = clientFor([]);

    const result = await new CloudSyncService(repositories).sync(
      'house-1', user, 'trainer', '2026-08-05T00:00:00.000Z',
    );

    expect(result).toEqual({ pushed: 1, pulled: 0 });
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ record_id: 'dog-new', updated_by: 'user-1' })],
      { onConflict: 'household_id,entity_type,record_id' },
    );
  });
});
