import type { User } from '@supabase/supabase-js';

import type { DomainRepositories } from '../../domain/repositories';
import { domainRepositories } from '../domainRepositories';
import type { Database, Json, TablesInsert } from './database.types';
import { getSupabaseClient } from './supabaseClient';

export type CloudRecordType = Database['public']['Enums']['cloud_record_type'];
type LocalEntity = { readonly id: string; readonly dogId?: string; readonly createdAt?: string; readonly updatedAt?: string };

export const cloudCollections: ReadonlyArray<{
  readonly type: CloudRecordType;
  readonly repository: keyof DomainRepositories;
}> = [
  { type: 'owner', repository: 'owners' },
  { type: 'dog', repository: 'dogs' },
  { type: 'behaviour_profile', repository: 'behaviourProfiles' },
  { type: 'behaviour_assessment', repository: 'behaviourAssessments' },
  { type: 'lesson_progress', repository: 'lessonProgress' },
  { type: 'daily_plan', repository: 'dailyPlans' },
  { type: 'training_session', repository: 'trainingSessions' },
  { type: 'achievement', repository: 'achievements' },
  { type: 'progress', repository: 'progress' },
  { type: 'notification_settings', repository: 'notificationSettings' },
  { type: 'troubleshooter_attempt', repository: 'troubleshooterAttempts' },
];

function toJson(type: CloudRecordType, entity: LocalEntity): Json {
  const payload = JSON.parse(JSON.stringify(entity)) as Record<string, Json | undefined>;
  if (type === 'dog') delete payload.photoUri;
  return payload;
}

export class LocalCloudBackupService {
  constructor(private readonly repositories: DomainRepositories = domainRepositories) {}

  async backup(householdId: string, user: User): Promise<number> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');

    const records = await this.collect(householdId, user);
    if (records.length === 0) return 0;

    const { error } = await client
      .from('cloud_records')
      .upsert(records, { onConflict: 'household_id,entity_type,record_id' });
    if (error) throw error;
    return records.length;
  }

  async collect(householdId: string, user: User): Promise<TablesInsert<'cloud_records'>[]> {
    const groupedRecords = await Promise.all(cloudCollections.map(async ({ type, repository }) => {
      const entities = await this.repositories[repository].findAll() as readonly LocalEntity[];
      return entities.map<TablesInsert<'cloud_records'>>((entity) => ({
        household_id: householdId,
        entity_type: type,
        record_id: entity.id,
        dog_id: type === 'dog' ? entity.id : entity.dogId ?? null,
        payload: toJson(type, entity),
        local_updated_at: entity.updatedAt ?? entity.createdAt ?? new Date().toISOString(),
        updated_by: user.id,
      }));
    }));
    return groupedRecords.flat();
  }
}

export const localCloudBackupService = new LocalCloudBackupService();
