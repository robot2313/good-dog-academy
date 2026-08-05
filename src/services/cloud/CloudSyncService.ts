import type { User } from '@supabase/supabase-js';

import type {
  Achievement,
  BehaviourAssessment,
  BehaviourProfile,
  DailyPlan,
  Dog,
  LessonProgress,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
  TroubleshooterAttempt,
} from '../../domain/models';
import type { DomainRepositories } from '../../domain/repositories';
import { domainRepositories } from '../domainRepositories';
import type { HouseholdRole } from './CloudHouseholdService';
import type { Tables, TablesInsert } from './database.types';
import { LocalCloudBackupService } from './LocalCloudBackupService';
import { getSupabaseClient } from './supabaseClient';

export type CloudSyncResult = { readonly pushed: number; readonly pulled: number };
type CloudRecord = Tables<'cloud_records'>;

function keyOf(record: Pick<CloudRecord, 'entity_type' | 'record_id'>): string {
  return `${record.entity_type}:${record.record_id}`;
}

function payloadAs<T>(record: CloudRecord): T {
  if (!record.payload || typeof record.payload !== 'object' || Array.isArray(record.payload)) {
    throw new Error(`Cloud ${record.entity_type} record is invalid.`);
  }
  return record.payload as unknown as T;
}

export class CloudSyncService {
  private readonly backupService: LocalCloudBackupService;

  constructor(private readonly repositories: DomainRepositories = domainRepositories) {
    this.backupService = new LocalCloudBackupService(repositories);
  }

  async sync(
    householdId: string,
    user: User,
    role: HouseholdRole,
    localUploadAfter?: string,
  ): Promise<CloudSyncResult> {
    const client = getSupabaseClient();
    if (!client) throw new Error('Cloud accounts are not configured.');
    const [local, remoteResponse] = await Promise.all([
      this.backupService.collect(householdId, user),
      client.from('cloud_records').select('*').eq('household_id', householdId),
    ]);
    if (remoteResponse.error) throw remoteResponse.error;
    const remote = remoteResponse.data;
    const localByKey = new Map(local.map((record) => [keyOf(record as CloudRecord), record]));
    const remoteByKey = new Map(remote.map((record) => [keyOf(record), record]));
    const outgoing: TablesInsert<'cloud_records'>[] = [];
    let pulled = 0;

    for (const cloudRecord of remote) {
      const localRecord = localByKey.get(keyOf(cloudRecord));
      if (cloudRecord.deleted_at) {
        await this.removeLocal(cloudRecord);
        pulled += 1;
      } else if (!localRecord || cloudRecord.local_updated_at > localRecord.local_updated_at) {
        await this.saveLocal(cloudRecord);
        pulled += 1;
      } else if (role !== 'viewer' && localRecord.local_updated_at > cloudRecord.local_updated_at) {
        outgoing.push(localRecord);
      }
    }

    if (role !== 'viewer') {
      for (const localRecord of local) {
        if (
          !remoteByKey.has(keyOf(localRecord as CloudRecord))
          && (!localUploadAfter || localRecord.local_updated_at >= localUploadAfter)
        ) outgoing.push(localRecord);
      }
    }

    if (outgoing.length > 0) {
      const { error } = await client.from('cloud_records').upsert(outgoing, {
        onConflict: 'household_id,entity_type,record_id',
      });
      if (error) throw error;
    }
    return { pushed: outgoing.length, pulled };
  }

  async applyRealtimeRecord(record: CloudRecord): Promise<void> {
    if (record.deleted_at) await this.removeLocal(record);
    else await this.saveLocal(record);
  }

  private async saveLocal(record: CloudRecord): Promise<void> {
    switch (record.entity_type) {
      case 'owner': return this.repositories.owners.save(payloadAs<Owner>(record));
      case 'dog': {
        const incoming = payloadAs<Dog>(record);
        const current = await this.repositories.dogs.findById(incoming.id);
        return this.repositories.dogs.save(current?.photoUri ? { ...incoming, photoUri: current.photoUri } : incoming);
      }
      case 'behaviour_profile': return this.repositories.behaviourProfiles.save(payloadAs<BehaviourProfile>(record));
      case 'behaviour_assessment': return this.repositories.behaviourAssessments.save(payloadAs<BehaviourAssessment>(record));
      case 'lesson_progress': return this.repositories.lessonProgress.save(payloadAs<LessonProgress>(record));
      case 'daily_plan': return this.repositories.dailyPlans.save(payloadAs<DailyPlan>(record));
      case 'training_session': return this.repositories.trainingSessions.save(payloadAs<TrainingSession>(record));
      case 'achievement': return this.repositories.achievements.save(payloadAs<Achievement>(record));
      case 'progress': return this.repositories.progress.save(payloadAs<Progress>(record));
      case 'notification_settings': return this.repositories.notificationSettings.save(payloadAs<NotificationSettings>(record));
      case 'troubleshooter_attempt': return this.repositories.troubleshooterAttempts.save(payloadAs<TroubleshooterAttempt>(record));
    }
  }

  private async removeLocal(record: CloudRecord): Promise<void> {
    switch (record.entity_type) {
      case 'owner': return this.repositories.owners.remove(record.record_id);
      case 'dog': return this.repositories.dogs.remove(record.record_id);
      case 'behaviour_profile': return this.repositories.behaviourProfiles.remove(record.record_id);
      case 'behaviour_assessment': return this.repositories.behaviourAssessments.remove(record.record_id);
      case 'lesson_progress': return this.repositories.lessonProgress.remove(record.record_id);
      case 'daily_plan': return this.repositories.dailyPlans.remove(record.record_id);
      case 'training_session': return this.repositories.trainingSessions.remove(record.record_id);
      case 'achievement': return this.repositories.achievements.remove(record.record_id);
      case 'progress': return this.repositories.progress.remove(record.record_id);
      case 'notification_settings': return this.repositories.notificationSettings.remove(record.record_id);
      case 'troubleshooter_attempt': return this.repositories.troubleshooterAttempts.remove(record.record_id);
    }
  }
}

export const cloudSyncService = new CloudSyncService();
