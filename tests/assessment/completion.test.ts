import { sampleBehaviourAssessment, sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { AssessmentCompletionService } from '../../src/features/assessment/AssessmentCompletionService';
import { BehaviourAssessmentTransactionService } from '../../src/features/assessment/BehaviourAssessmentTransactionService';
import { assessmentQuestions } from '../../src/features/assessment/catalogue';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { StorageTransactionManager, TransactionError } from '../../src/storage/StorageTransactionManager';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

const answers = Object.fromEntries(assessmentQuestions.map((question) => [question.id, 'sometimes'])) as Record<string, 'sometimes'>;
class ProfileWriteFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string) { return this.base.getItem<T>(key); }
  removeItem(key: string) { return this.base.removeItem(key); }
  setItem<T>(key: string, value: T) { return key === storageKeys.behaviourProfiles ? Promise.reject(new Error('profile write failed')) : this.base.setItem(key, value); }
}

describe('assessment completion', () => {
  it('atomically saves a new assessment and updates the matching profile', async () => {
    const storage = new InMemoryStorageAdapter();
    const service = new AssessmentCompletionService(new BehaviourAssessmentTransactionService(new StorageTransactionManager(storage)), () => 'assessment-new', () => '2026-07-19T02:00:00.000Z');
    const assessment = await service.complete({ owner: sampleOwner, dog: sampleDog, profile: { ...sampleBehaviourProfile, assessmentId: null }, answers });
    const repositories = createDomainRepositories(storage);
    await expect(repositories.behaviourAssessments.findById(assessment.id)).resolves.toEqual(assessment);
    await expect(repositories.behaviourProfiles.findById(sampleBehaviourProfile.id)).resolves.toMatchObject({ assessmentId: assessment.id, skillScores: assessment.calculatedScores });
  });

  it('leaves neither record partially written when profile commit fails', async () => {
    const base = new InMemoryStorageAdapter();
    const storage = new ProfileWriteFailingStorage(base);
    const service = new AssessmentCompletionService(new BehaviourAssessmentTransactionService(new StorageTransactionManager(storage)), () => 'assessment-new', () => '2026-07-19T02:00:00.000Z');
    await expect(service.complete({ owner: sampleOwner, dog: sampleDog, profile: { ...sampleBehaviourProfile, assessmentId: null }, answers })).rejects.toBeInstanceOf(TransactionError);
    await expect(base.getItem(storageKeys.behaviourAssessments)).resolves.toBeNull();
    await expect(base.getItem(storageKeys.behaviourProfiles)).resolves.toBeNull();
  });

  it('preserves previous assessment history when a new assessment completes', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
    const service = new AssessmentCompletionService(new BehaviourAssessmentTransactionService(new StorageTransactionManager(storage)), () => 'assessment-new', () => '2026-07-19T02:00:00.000Z');
    await service.complete({ owner: sampleOwner, dog: sampleDog, profile: sampleBehaviourProfile, answers });
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([sampleBehaviourAssessment, expect.objectContaining({ id: 'assessment-new' })]);
  });
});
