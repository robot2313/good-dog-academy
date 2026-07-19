import type { BehaviourAssessment, BehaviourProfile, Dog, Owner } from '../../domain/models';
import type { DomainRepositories } from '../../domain/repositories';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import type { StorageAdapter } from '../../storage/StorageAdapter';
import { createDomainRepositories } from '../../services/createDomainRepositories';

export type OnboardingStatus =
  | { state: 'not-started'; hasSavedData: false }
  | { state: 'incomplete'; hasSavedData: true; owner: Owner | null; dog: Dog | null }
  | { state: 'corrupt'; hasSavedData: true }
  | { state: 'assessment-required'; hasSavedData: true; owner: Owner; dog: Dog; behaviourProfile: BehaviourProfile }
  | { state: 'assessment-corrupt'; hasSavedData: true; owner: Owner; dog: Dog; behaviourProfile: BehaviourProfile }
  | { state: 'complete'; hasSavedData: true; owner: Owner; dog: Dog; behaviourProfile: BehaviourProfile; assessment: BehaviourAssessment };

const onboardingKeys = [storageKeys.owners, storageKeys.dogs, storageKeys.behaviourProfiles] as const;

export class OnboardingStatusService {
  constructor(
    private readonly repositories: DomainRepositories,
    private readonly transactions: StorageTransactionManager,
  ) {}

  async getStatus(): Promise<OnboardingStatus> {
    try {
      const [owners, dogs, profiles] = await Promise.all([
        this.repositories.owners.findAll(),
        this.repositories.dogs.findAll(),
        this.repositories.behaviourProfiles.findAll(),
      ]);
      if (owners.length === 0 && dogs.length === 0 && profiles.length === 0) return { state: 'not-started', hasSavedData: false };

      const owner = owners[0] ?? null;
      const dog = owner ? dogs.find((candidate) => candidate.ownerId === owner.id) ?? null : null;
      const profile = dog ? profiles.find((candidate) => candidate.dogId === dog.id) : null;
      if (owner && dog && profile) {
        try {
          const assessments = await this.repositories.behaviourAssessments.findAll();
          const assessment = profile.assessmentId
            ? assessments.find((candidate) => candidate.id === profile.assessmentId) ?? null
            : null;
          if (assessment && assessment.ownerId === owner.id && assessment.dogId === dog.id) {
            return { state: 'complete', hasSavedData: true, owner, dog, behaviourProfile: profile, assessment };
          }
          return { state: 'assessment-required', hasSavedData: true, owner, dog, behaviourProfile: profile };
        } catch {
          return { state: 'assessment-corrupt', hasSavedData: true, owner, dog, behaviourProfile: profile };
        }
      }
      return { state: 'incomplete', hasSavedData: true, owner, dog };
    } catch {
      return { state: 'corrupt', hasSavedData: true };
    }
  }

  async clearIncompleteData(): Promise<void> {
    await this.transactions.run(onboardingKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      await repositories.behaviourProfiles.clear();
      await repositories.dogs.clear();
      await repositories.owners.clear();
    });
  }
}

export function createOnboardingStatusService(storage: StorageAdapter): OnboardingStatusService {
  return new OnboardingStatusService(createDomainRepositories(storage), new StorageTransactionManager(storage));
}
