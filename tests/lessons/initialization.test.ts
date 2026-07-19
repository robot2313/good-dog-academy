import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonProgressInitializationService } from '../../src/features/lessons/progress';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { InitializationError } from '../../src/services/initialization';
import type { StorageAdapter } from '../../src/storage/StorageAdapter';
import { StorageTransactionManager } from '../../src/storage/StorageTransactionManager';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonDefinitions, lessonProgress, recallLesson } from '../support/lessonFixtures';

class ProgressWriteFailingStorage implements StorageAdapter {
  constructor(private readonly base: StorageAdapter) {}
  getItem<T>(key: string) { return this.base.getItem<T>(key); }
  removeItem(key: string) { return this.base.removeItem(key); }
  setItem<T>(key: string, value: T) { return key === storageKeys.lessonProgress ? Promise.reject(new Error('injected progress failure')) : this.base.setItem(key, value); }
}

async function setup(storage: StorageAdapter) {
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  return repositories;
}

describe('LessonProgressInitializationService', () => {
  it('does nothing for an empty catalogue', async () => {
    const storage = new InMemoryStorageAdapter();
    await setup(storage);
    const service = new LessonProgressInitializationService(new StorageTransactionManager(storage), LessonCatalogue.load([]), jest.fn(() => 'unused'), () => '2026-07-19T03:00:00.000Z');
    await expect(service.initialize(sampleOwner.id, sampleDog.id)).resolves.toEqual([]);
    await expect(storage.getItem(storageKeys.lessonProgress)).resolves.toBeNull();
  });

  it('creates root lessons as available and prerequisite lessons as locked', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = await setup(storage);
    let sequence = 0;
    const service = new LessonProgressInitializationService(new StorageTransactionManager(storage), LessonCatalogue.load(lessonDefinitions), () => `progress-${++sequence}`, () => '2026-07-19T03:00:00.000Z');
    const result = await service.initialize(sampleOwner.id, sampleDog.id);
    expect(result.find((item) => item.lessonId === foundationLesson.id)).toMatchObject({ status: 'available', unlockedAt: '2026-07-19T03:00:00.000Z' });
    expect(result.find((item) => item.lessonId === recallLesson.id)).toMatchObject({ status: 'locked', unlockedAt: null });
    await expect(repositories.lessonProgress.findAll()).resolves.toHaveLength(3);
  });

  it('preserves existing progress and is idempotent', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = await setup(storage);
    const existing = lessonProgress({ status: 'inProgress', attempts: 2, lastAttemptedAt: '2026-07-19T02:00:00.000Z' });
    await repositories.lessonProgress.save(existing);
    let sequence = 0;
    const createId = jest.fn(() => `progress-new-${++sequence}`);
    const service = new LessonProgressInitializationService(new StorageTransactionManager(storage), LessonCatalogue.load(lessonDefinitions), createId, () => '2026-07-19T03:00:00.000Z');
    await service.initialize(sampleOwner.id, sampleDog.id);
    const once = await repositories.lessonProgress.findAll();
    await service.initialize(sampleOwner.id, sampleDog.id);
    expect(await repositories.lessonProgress.findAll()).toEqual(once);
    expect(await repositories.lessonProgress.findById(existing.id)).toEqual(existing);
    expect(createId).toHaveBeenCalledTimes(2);
  });

  it('rolls back every progress write and returns a structured failure', async () => {
    const base = new InMemoryStorageAdapter();
    await setup(base);
    const service = new LessonProgressInitializationService(new StorageTransactionManager(new ProgressWriteFailingStorage(base)), LessonCatalogue.load(lessonDefinitions), () => 'progress-new', () => '2026-07-19T03:00:00.000Z');
    await expect(service.initialize(sampleOwner.id, sampleDog.id)).rejects.toMatchObject<Partial<InitializationError>>({ code: 'LESSON_PROGRESS_INITIALIZATION_FAILED' });
    await expect(base.getItem(storageKeys.lessonProgress)).resolves.toBeNull();
  });
});
