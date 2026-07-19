import type { LessonDefinition, LessonId, LessonProgress, LessonProgressStatus } from '../../../domain/models';
import type { LessonCatalogue } from '../catalogue';

export type LessonUnlockErrorCode = 'MISSING_LESSON_REFERENCE' | 'DUPLICATE_LESSON_PROGRESS';

export class LessonUnlockError extends Error {
  constructor(readonly code: LessonUnlockErrorCode, readonly context: Record<string, unknown>) {
    super(code);
    this.name = 'LessonUnlockError';
  }
}

export class LessonUnlockService {
  constructor(private readonly catalogue: LessonCatalogue) {}

  determineStatuses(progressRecords: readonly LessonProgress[]): ReadonlyMap<LessonId, LessonProgressStatus> {
    const progressByLesson = new Map<LessonId, LessonProgress>();
    for (const progress of progressRecords) {
      if (!this.catalogue.findById(progress.lessonId)) throw new LessonUnlockError('MISSING_LESSON_REFERENCE', { progressId: progress.id, lessonId: progress.lessonId });
      if (progressByLesson.has(progress.lessonId)) throw new LessonUnlockError('DUPLICATE_LESSON_PROGRESS', { lessonId: progress.lessonId });
      progressByLesson.set(progress.lessonId, progress);
    }

    const result = new Map<LessonId, LessonProgressStatus>();
    for (const definition of this.catalogue.definitions) result.set(definition.id, this.determineStatus(definition, progressByLesson));
    return result;
  }

  private determineStatus(definition: LessonDefinition, progressByLesson: ReadonlyMap<LessonId, LessonProgress>): LessonProgressStatus {
    if (!definition.isActive) return 'locked';
    const current = progressByLesson.get(definition.id);
    if (current && this.meetsCompletionCriteria(definition, current)) return 'completed';

    const prerequisitesMet = definition.prerequisites.every((prerequisite) => {
      const progress = progressByLesson.get(prerequisite.lessonId);
      return Boolean(progress && progress.successfulCompletions >= prerequisite.minimumSuccessfulCompletions);
    });
    if (!prerequisitesMet) return 'locked';
    if (current && (current.attempts > 0 || current.status === 'inProgress')) return 'inProgress';
    return 'available';
  }

  private meetsCompletionCriteria(definition: LessonDefinition, progress: LessonProgress): boolean {
    const criteria = definition.completionCriteria;
    return progress.successfulCompletions >= criteria.minimumSuccessfulCompletions
      && (criteria.minimumPerformanceRating === null || (progress.bestPerformanceRating ?? 0) >= criteria.minimumPerformanceRating);
  }
}
