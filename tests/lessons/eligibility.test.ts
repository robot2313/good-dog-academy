import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonEligibilityError, LessonEligibilityService } from '../../src/features/lessons/eligibility';
import { LessonProgressInitializationService, LessonUnlockService } from '../../src/features/lessons/progress';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';

describe('Daily Plan lesson eligibility contract', () => {
  it('allows available lessons as new learning and returns deterministic results', () => {
    const service = new LessonEligibilityService(LessonCatalogue.load([foundationLesson]));
    const first = service.evaluate(foundationLesson.id, 12, []);
    expect(first).toMatchObject({ eligible: true, status: 'available', prerequisitesMet: true, ageEligible: true, isActive: true, isKnownSkill: true, canBeNewLearning: true, canBeReinforcement: false });
    expect(service.evaluate(foundationLesson.id, 12, [])).toEqual(first);
  });

  it('allows completed lessons only as reinforcement', () => {
    const service = new LessonEligibilityService(LessonCatalogue.load([foundationLesson]));
    const completed = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' });
    expect(service.evaluate(foundationLesson.id, 12, [completed])).toMatchObject({ eligible: true, status: 'completed', canBeNewLearning: false, canBeReinforcement: true, reasons: ['COMPLETED_REINFORCEMENT_ONLY'] });
  });

  it('makes locked lessons ineligible for both learning modes', () => {
    const service = new LessonEligibilityService(LessonCatalogue.load([foundationLesson, recallLesson]));
    expect(service.evaluate(recallLesson.id, 12, [])).toMatchObject({ eligible: false, status: 'locked', prerequisitesMet: false, canBeNewLearning: false, canBeReinforcement: false });
  });

  it('enforces minimum age', () => {
    const ageLesson = { ...foundationLesson, minimumDogAgeMonths: 6 };
    const service = new LessonEligibilityService(LessonCatalogue.load([ageLesson]));
    expect(service.evaluate(ageLesson.id, 5, [])).toMatchObject({ eligible: false, ageEligible: false, reasons: ['DOG_BELOW_MINIMUM_AGE'] });
    expect(service.evaluate(ageLesson.id, 6, [])).toMatchObject({ eligible: true, ageEligible: true });
  });

  it('throws a structured error for a missing lesson reference', () => {
    const service = new LessonEligibilityService(LessonCatalogue.load([foundationLesson]));
    expect(() => service.evaluate('missing-lesson-reference', 12, [])).toThrow(expect.objectContaining<Partial<LessonEligibilityError>>({ code: 'MISSING_LESSON_REFERENCE' }));
  });
});

describe('inactive and content-version policies', () => {
  it('keeps inactive lessons locked and ineligible while retaining existing progress', async () => {
    const inactive = { ...foundationLesson, isActive: false };
    const existing = lessonProgress({ status: 'completed', attempts: 2, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' });
    const catalogue = LessonCatalogue.load([inactive]);
    expect(new LessonUnlockService(catalogue).determineStatuses([existing]).get(inactive.id)).toBe('locked');
    expect(new LessonEligibilityService(catalogue).evaluate(inactive.id, 12, [existing])).toMatchObject({ eligible: false, isActive: false, status: 'locked', canBeNewLearning: false, canBeReinforcement: false });

    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner); await repositories.dogs.save(sampleDog); await repositories.lessonProgress.save(existing);
    const service = new LessonProgressInitializationService(new StorageTransactionManager(storage), catalogue, () => 'unused-id', () => '2026-07-19T02:00:00.000Z');
    await service.initialize(sampleOwner.id, sampleDog.id);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual([existing]);
  });

  it('does not create progress for a newly inactive lesson and resumes retained progress when reactivated', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner); await repositories.dogs.save(sampleDog);
    const inactive = { ...foundationLesson, isActive: false };
    await new LessonProgressInitializationService(new StorageTransactionManager(storage), LessonCatalogue.load([inactive]), () => 'should-not-run', () => '2026-07-19T02:00:00.000Z').initialize(sampleOwner.id, sampleDog.id);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual([]);

    const retained = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' });
    await repositories.lessonProgress.save(retained);
    expect(new LessonUnlockService(LessonCatalogue.load([{ ...inactive, isActive: true }])).determineStatuses([retained]).get(inactive.id)).toBe('completed');
  });

  it('preserves progress when contentVersion increases for the same stable ID', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner); await repositories.dogs.save(sampleDog);
    const retained = lessonProgress({ status: 'completed', attempts: 3, successfulCompletions: 2, lastAttemptedAt: '2026-07-19T01:00:00.000Z', lastCompletedAt: '2026-07-19T01:00:00.000Z', bestPerformanceRating: 4 });
    await repositories.lessonProgress.save(retained);
    const versionTwo = { ...foundationLesson, contentVersion: 2 };
    await new LessonProgressInitializationService(new StorageTransactionManager(storage), LessonCatalogue.load([versionTwo]), () => 'unused-id', () => '2026-07-19T02:00:00.000Z').initialize(sampleOwner.id, sampleDog.id);
    await expect(repositories.lessonProgress.findById(retained.id)).resolves.toEqual(retained);
  });
});
