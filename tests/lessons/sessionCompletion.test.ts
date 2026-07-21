import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonSessionCompletionService } from '../../src/features/lessons/progress';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';

describe('LessonSessionCompletionService', () => {
  it('atomically records a successful session, performance, and newly unlocked lesson', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.lessonProgress.save(lessonProgress());
    await repositories.lessonProgress.save(lessonProgress({ id: 'recall-progress', lessonId: recallLesson.id, status: 'locked', unlockedAt: null }));
    const service = new LessonSessionCompletionService(new StorageTransactionManager(storage), LessonCatalogue.load([foundationLesson, recallLesson]), () => 'session-1', () => '2026-07-22T03:00:00.000Z');

    const result = await service.complete(foundationLesson.id, sampleDog.id, 5);

    expect(result.progress.find((record) => record.lessonId === foundationLesson.id)).toMatchObject({ status: 'completed', attempts: 1, successfulCompletions: 1, bestPerformanceRating: 5 });
    expect(result.progress.find((record) => record.lessonId === recallLesson.id)).toMatchObject({ status: 'available', unlockedAt: '2026-07-22T03:00:00.000Z' });
    expect(result.session).toMatchObject({ id: 'session-1', dogId: sampleDog.id, lessonId: foundationLesson.id, durationMinutes: 5, outcome: 'success' });
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([result.session]);
  });

  it('records an unsuccessful attempt without counting a successful completion', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    await repositories.lessonProgress.save(lessonProgress());
    const service = new LessonSessionCompletionService(new StorageTransactionManager(storage), LessonCatalogue.load([foundationLesson]), () => 'session-2', () => '2026-07-22T03:00:00.000Z');
    const result = await service.complete(foundationLesson.id, sampleDog.id, 2);
    expect(result.progress[0]).toMatchObject({ status: 'inProgress', attempts: 1, successfulCompletions: 0, bestPerformanceRating: 2 });
    expect(result.session.outcome).toBe('unsuccessful');
  });
});
