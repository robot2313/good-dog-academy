import type { LessonProgress } from '../../../domain/models';
import { createDomainRepositories } from '../../../services/createDomainRepositories';
import { InitializationError } from '../../../services/initialization';
import { StorageTransactionManager } from '../../../storage/StorageTransactionManager';
import { storageKeys } from '../../../storage/storageKeys';
import type { LessonCatalogue } from '../catalogue';
import { LessonUnlockService } from './LessonUnlockService';

const initializationKeys = [storageKeys.owners, storageKeys.dogs, storageKeys.lessonProgress] as const;

export class LessonProgressInitializationService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly catalogue: LessonCatalogue,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
  ) {}

  async initialize(ownerId: string, dogId: string): Promise<LessonProgress[]> {
    try {
      return await this.transactions.run(initializationKeys, async (storage) => {
        const repositories = createDomainRepositories(storage);
        const [owner, dog, allProgress] = await Promise.all([
          repositories.owners.findById(ownerId),
          repositories.dogs.findById(dogId),
          repositories.lessonProgress.findAll(),
        ]);
        if (!owner || !dog || dog.ownerId !== owner.id) throw new Error('Owner and dog relationship is invalid.');

        const dogProgress = allProgress.filter((progress) => progress.dogId === dogId);
        if (dogProgress.some((progress) => progress.ownerId !== ownerId)) throw new Error('Lesson progress ownership is invalid.');
        const statuses = new LessonUnlockService(this.catalogue).determineStatuses(dogProgress);
        const existingLessonIds = new Set(dogProgress.map((progress) => progress.lessonId));
        const timestamp = this.now();
        const created: LessonProgress[] = [];

        for (const definition of this.catalogue.definitions) {
          if (existingLessonIds.has(definition.id)) continue;
          const status = statuses.get(definition.id) ?? 'locked';
          const progress: LessonProgress = {
            id: this.createId('lesson-progress'), ownerId, dogId, lessonId: definition.id, status,
            attempts: 0, successfulCompletions: 0, lastAttemptedAt: null, lastCompletedAt: null,
            bestPerformanceRating: null, currentDifficultyAdjustment: 0,
            unlockedAt: status === 'locked' ? null : timestamp,
            createdAt: timestamp, updatedAt: timestamp,
          };
          await repositories.lessonProgress.save(progress);
          created.push(progress);
        }

        return [...dogProgress, ...created].sort((a, b) => {
          const aIndex = this.catalogue.definitions.findIndex((definition) => definition.id === a.lessonId);
          const bIndex = this.catalogue.definitions.findIndex((definition) => definition.id === b.lessonId);
          return aIndex - bIndex;
        });
      });
    } catch (cause) {
      throw new InitializationError('LESSON_PROGRESS_INITIALIZATION_FAILED', { phase: 'lesson-progress-initialization', ownerId, dogId, catalogueSize: this.catalogue.definitions.length }, true, { cause });
    }
  }
}
