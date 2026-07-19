import type { BehaviourAssessment, BehaviourProfile } from '../../domain/models';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';

const assessmentKeys = [storageKeys.behaviourAssessments, storageKeys.behaviourProfiles] as const;

export class BehaviourAssessmentTransactionService {
  constructor(private readonly transactions: StorageTransactionManager) {}

  async complete(assessment: BehaviourAssessment, profile: BehaviourProfile): Promise<void> {
    await this.transactions.run(assessmentKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      await repositories.behaviourAssessments.save(assessment);
      await repositories.behaviourProfiles.save(profile);
    });
  }

  async clearCorruptAssessments(profile: BehaviourProfile): Promise<void> {
    await this.transactions.run(assessmentKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      await repositories.behaviourAssessments.clear();
      await repositories.behaviourProfiles.save({ ...profile, assessmentId: null, updatedAt: new Date().toISOString() });
    });
  }
}
