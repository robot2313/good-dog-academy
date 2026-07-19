import { sampleBehaviourAssessment, sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { createOnboardingStatusService } from '../../src/features/onboarding/OnboardingStatusService';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';

describe('OnboardingStatusService', () => {
  it('reports no onboarding data for an empty database', async () => {
    await expect(createOnboardingStatusService(new InMemoryStorageAdapter()).getStatus()).resolves.toEqual({ state: 'not-started', hasSavedData: false });
  });

  it('reports complete only when owner, dog, and behaviour profile are related', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toMatchObject({ state: 'complete', owner: sampleOwner, dog: sampleDog });
  });

  it('does not treat incomplete records as completed onboarding', async () => {
    const storage = new InMemoryStorageAdapter();
    await createDomainRepositories(storage).owners.save(sampleOwner);
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toMatchObject({ state: 'incomplete', hasSavedData: true });
  });

  it('requires assessment when setup is complete but no matching assessment exists', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save({ ...sampleBehaviourProfile, assessmentId: null });
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toMatchObject({ state: 'assessment-required', owner: sampleOwner, dog: sampleDog });
  });

  it('does not accept an assessment with mismatched ownership', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await repositories.behaviourAssessments.save({ ...sampleBehaviourAssessment, ownerId: 'different-owner' });
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toMatchObject({ state: 'assessment-required' });
  });

  it('reports corrupt assessment data separately while preserving valid setup', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await storage.setItem(storageKeys.behaviourAssessments, [{ id: null }]);
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toMatchObject({ state: 'assessment-corrupt', owner: sampleOwner, dog: sampleDog });
  });

  it('reports corrupt persisted records safely', async () => {
    const storage = new InMemoryStorageAdapter();
    await storage.setItem(storageKeys.owners, [{ id: null }]);
    await expect(createOnboardingStatusService(storage).getStatus()).resolves.toEqual({ state: 'corrupt', hasSavedData: true });
  });

  it('can safely clear incomplete onboarding records', async () => {
    const storage = new InMemoryStorageAdapter();
    await createDomainRepositories(storage).owners.save(sampleOwner);
    const service = createOnboardingStatusService(storage);
    await service.clearIncompleteData();
    await expect(service.getStatus()).resolves.toEqual({ state: 'not-started', hasSavedData: false });
  });
});
