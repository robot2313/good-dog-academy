import type { User } from '@supabase/supabase-js';

import type { DomainRepositories, Repository } from '../../src/domain/repositories';
import { LocalCloudBackupService } from '../../src/services/cloud/LocalCloudBackupService';
import { getSupabaseClient } from '../../src/services/cloud/supabaseClient';

jest.mock('../../src/services/cloud/supabaseClient', () => ({ getSupabaseClient: jest.fn() }));

const mockGetSupabaseClient = jest.mocked(getSupabaseClient);

function repository<T extends { id: string }>(records: readonly T[]): Repository<T> {
  return {
    findAll: jest.fn().mockResolvedValue(records),
    findById: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn(),
  };
}

function repositories(): DomainRepositories {
  const empty = () => repository([]);
  return {
    owners: repository([{ id: 'owner-1', displayName: 'Taylor', createdAt: '2026-08-01T00:00:00.000Z' }]),
    dogs: repository([{ id: 'dog-1', ownerId: 'owner-1', name: 'Pepper', photoUri: 'file:///private/photo.jpg', updatedAt: '2026-08-02T00:00:00.000Z' }]),
    behaviourProfiles: empty(),
    behaviourAssessments: empty(),
    lessonProgress: empty(),
    dailyPlans: empty(),
    trainingSessions: empty(),
    achievements: empty(),
    progress: empty(),
    notificationSettings: empty(),
    troubleshooterAttempts: empty(),
  } as unknown as DomainRepositories;
}

describe('LocalCloudBackupService', () => {
  it('backs up local records idempotently without uploading the local dog photo path', async () => {
    const upsert = jest.fn().mockResolvedValue({ error: null });
    mockGetSupabaseClient.mockReturnValue({ from: jest.fn().mockReturnValue({ upsert }) } as never);
    const service = new LocalCloudBackupService(repositories());

    const count = await service.backup('house-1', { id: 'user-1' } as User);

    expect(count).toBe(2);
    expect(upsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ entity_type: 'owner', record_id: 'owner-1', dog_id: null, updated_by: 'user-1' }),
      expect.objectContaining({ entity_type: 'dog', record_id: 'dog-1', dog_id: 'dog-1', updated_by: 'user-1' }),
    ]), { onConflict: 'household_id,entity_type,record_id' });
    const dogRecord = upsert.mock.calls[0]?.[0].find((record: { entity_type: string }) => record.entity_type === 'dog');
    expect(dogRecord.payload).not.toHaveProperty('photoUri');
  });

  it('does not call the cloud when there are no local records', async () => {
    const upsert = jest.fn();
    mockGetSupabaseClient.mockReturnValue({ from: jest.fn().mockReturnValue({ upsert }) } as never);
    const repos = Object.fromEntries([
      'owners', 'dogs', 'behaviourProfiles', 'behaviourAssessments', 'lessonProgress', 'dailyPlans',
      'trainingSessions', 'achievements', 'progress', 'notificationSettings', 'troubleshooterAttempts',
    ].map((key) => [key, repository([])])) as unknown as DomainRepositories;

    await expect(new LocalCloudBackupService(repos).backup('house-1', { id: 'user-1' } as User)).resolves.toBe(0);
    expect(upsert).not.toHaveBeenCalled();
  });
});
