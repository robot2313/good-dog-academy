import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonUnlockError, LessonUnlockService } from '../../src/features/lessons/progress';
import { advancedLesson, foundationLesson, lessonDefinitions, lessonProgress, recallLesson } from '../support/lessonFixtures';

describe('LessonUnlockService', () => {
  const catalogue = LessonCatalogue.load(lessonDefinitions);
  const service = new LessonUnlockService(catalogue);

  it('makes roots available and prerequisite lessons locked with no progress', () => {
    expect(Object.fromEntries(service.determineStatuses([]))).toEqual({
      [foundationLesson.id]: 'available', [recallLesson.id]: 'locked', [advancedLesson.id]: 'locked',
    });
  });

  it('unlocks a lesson only when its prerequisite completion condition is met', () => {
    const completedFoundation = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, lastAttemptedAt: '2026-07-19T01:00:00.000Z', lastCompletedAt: '2026-07-19T01:00:00.000Z', bestPerformanceRating: 3 });
    expect(service.determineStatuses([completedFoundation]).get(foundationLesson.id)).toBe('completed');
    expect(service.determineStatuses([completedFoundation]).get(recallLesson.id)).toBe('available');
  });

  it('requires every condition for multiple prerequisites', () => {
    const foundation = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' });
    const recall = lessonProgress({ id: 'progress-recall', lessonId: recallLesson.id, status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' });
    expect(service.determineStatuses([foundation, recall]).get(advancedLesson.id)).toBe('locked');
    expect(service.determineStatuses([{ ...foundation }, { ...recall, attempts: 2, successfulCompletions: 2 }]).get(advancedLesson.id)).toBe('available');
  });

  it('derives in-progress and completed statuses deterministically', () => {
    expect(service.determineStatuses([lessonProgress({ status: 'inProgress', attempts: 1, lastAttemptedAt: '2026-07-19T01:00:00.000Z' })]).get(foundationLesson.id)).toBe('inProgress');
    expect(service.determineStatuses([lessonProgress({ status: 'available', attempts: 2, successfulCompletions: 1, lastCompletedAt: '2026-07-19T01:00:00.000Z' })]).get(foundationLesson.id)).toBe('completed');
  });

  it('rejects progress that references missing catalogue content', () => {
    expect(() => service.determineStatuses([lessonProgress({ lessonId: 'missing-lesson-reference' })])).toThrow(expect.objectContaining<Partial<LessonUnlockError>>({ code: 'MISSING_LESSON_REFERENCE' }));
  });
});
