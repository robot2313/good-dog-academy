import type { LessonProgress } from '../../src/domain/models';
import { sampleDog } from '../../src/development/seed/sampleData';
import { LessonCatalogue, loadBundledLessonCatalogue } from '../../src/features/lessons/catalogue';
import { LessonLibraryError, LessonLibraryService } from '../../src/features/lessons/library';
import { advancedLesson, foundationLesson, lessonDefinitions, lessonProgress, recallLesson } from '../support/lessonFixtures';

describe('LessonLibraryService', () => {
  const catalogue = LessonCatalogue.load(lessonDefinitions);

  it('reads every catalogue lesson and exposes immutable library metadata', () => {
    const productionCatalogue = loadBundledLessonCatalogue();
    const items = new LessonLibraryService(productionCatalogue, sampleDog.id, []).getAllLessons();

    expect(items).toHaveLength(productionCatalogue.definitions.length);
    expect(items).toHaveLength(30);
    expect(items.every((item) => item.id && item.title && item.description && item.estimatedMinutes > 0 && item.keywords.length > 0)).toBe(true);
    expect(Object.isFrozen(items)).toBe(true);
    expect(Object.isFrozen(items[0].keywords)).toBe(true);
  });

  it('groups lessons by existing skills in deterministic skill order', () => {
    const groups = new LessonLibraryService(catalogue, sampleDog.id, []).getGroupedLessons();

    expect(groups.map((group) => [group.skill, group.title])).toEqual([
      ['recall', 'Recall'],
      ['impulse-control', 'Impulse Control'],
      ['focus', 'Focus'],
    ]);
    expect(groups.flatMap((group) => group.lessons.map((lesson) => lesson.id))).toHaveLength(lessonDefinitions.length);
    expect(Object.isFrozen(groups)).toBe(true);
    expect(Object.isFrozen(groups[0].lessons)).toBe(true);
  });

  it('derives available, in-progress, completed, and locked states from selected-dog progress', () => {
    const noProgress = new LessonLibraryService(catalogue, sampleDog.id, []);
    expect(noProgress.getLessonSummary(foundationLesson.id).state).toBe('AVAILABLE');
    expect(noProgress.getLessonSummary(recallLesson.id).state).toBe('LOCKED');

    const inProgress = lessonProgress({ status: 'inProgress', attempts: 1, lastAttemptedAt: '2026-07-22T01:00:00.000Z' });
    expect(new LessonLibraryService(catalogue, sampleDog.id, [inProgress]).getLessonSummary(foundationLesson.id).state).toBe('IN_PROGRESS');

    const completed = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, bestPerformanceRating: 3, lastAttemptedAt: '2026-07-22T01:00:00.000Z', lastCompletedAt: '2026-07-22T01:00:00.000Z' });
    const completedService = new LessonLibraryService(catalogue, sampleDog.id, [completed]);
    expect(completedService.getLessonSummary(foundationLesson.id).state).toBe('COMPLETED');
    expect(completedService.getLessonSummary(recallLesson.id).state).toBe('AVAILABLE');
  });

  it('does not use another dog’s progress for the selected dog', () => {
    const otherDogProgress = lessonProgress({ dogId: 'dog-other', status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-22T01:00:00.000Z' });
    const service = new LessonLibraryService(catalogue, sampleDog.id, [otherDogProgress]);

    expect(service.getLessonSummary(foundationLesson.id).state).toBe('AVAILABLE');
    expect(service.getLessonSummary(recallLesson.id).state).toBe('LOCKED');
  });

  it('includes a readable reason and missing prerequisite IDs and names on locked lessons', () => {
    const service = new LessonLibraryService(catalogue, sampleDog.id, []);
    const recall = service.getLessonSummary(recallLesson.id);
    const advanced = service.getLessonSummary(advancedLesson.id);

    expect(recall).toMatchObject({
      state: 'LOCKED',
      lock: {
        reason: `Complete ${foundationLesson.title} first.`,
        missingPrerequisiteIds: [foundationLesson.id],
        missingPrerequisiteNames: [foundationLesson.title],
      },
    });
    expect(advanced).toMatchObject({
      state: 'LOCKED',
      lock: {
        missingPrerequisiteIds: [foundationLesson.id, recallLesson.id],
        missingPrerequisiteNames: [foundationLesson.title, recallLesson.title],
      },
    });
    expect(recall.state === 'LOCKED' && Object.isFrozen(recall.lock.missingPrerequisiteIds)).toBe(true);
  });

  it('reports inactive content as locked without dropping prerequisite details', () => {
    const inactive = { ...recallLesson, isActive: false };
    const service = new LessonLibraryService(LessonCatalogue.load([foundationLesson, inactive]), sampleDog.id, []);

    expect(service.getLessonSummary(inactive.id)).toMatchObject({
      state: 'LOCKED',
      lock: { reason: 'This lesson is not currently available.', missingPrerequisiteIds: [foundationLesson.id] },
    });
  });

  it('searches title, description, and keywords case-insensitively', () => {
    const service = new LessonLibraryService(catalogue, sampleDog.id, []);

    expect(service.searchLessons('FIXTURE RECALL').map((lesson) => lesson.id)).toEqual([recallLesson.id]);
    expect(service.searchLessons('test-ONLY foundation').map((lesson) => lesson.id)).toContain(foundationLesson.id);
    expect(service.searchLessons('IMPULSE CONTROL').map((lesson) => lesson.id)).toEqual([advancedLesson.id]);
    expect(service.searchLessons('   ')).toBe(service.getAllLessons());
    expect(service.searchLessons('not in this catalogue')).toEqual([]);
  });

  it('combines skill, difficulty, and progress-state filters', () => {
    const service = new LessonLibraryService(catalogue, sampleDog.id, []);

    expect(service.filterLessons({ skill: 'recall', difficulty: 2, state: 'LOCKED' }).map((lesson) => lesson.id)).toEqual([recallLesson.id]);
    expect(service.filterLessons({ skill: 'recall', difficulty: 1, state: 'LOCKED' })).toEqual([]);
    expect(service.filterLessons({ state: 'AVAILABLE' }).map((lesson) => lesson.id)).toEqual([foundationLesson.id]);
    expect(service.filterLessons({})).toEqual(service.getAllLessons());
  });

  it('gracefully returns empty collections for an empty catalogue', () => {
    const service = new LessonLibraryService(LessonCatalogue.load([]), sampleDog.id, []);
    expect(service.getAllLessons()).toEqual([]);
    expect(service.getGroupedLessons()).toEqual([]);
    expect(service.searchLessons('recall')).toEqual([]);
    expect(service.filterLessons({ state: 'AVAILABLE' })).toEqual([]);
  });

  it('throws a typed error when no dog is selected', () => {
    const service = new LessonLibraryService(catalogue, null, []);
    expect(() => service.getAllLessons()).toThrow(expect.objectContaining<Partial<LessonLibraryError>>({ code: 'MISSING_SELECTED_DOG' }));
  });

  it('throws typed errors for invalid, duplicate, and missing-reference progress', () => {
    const invalid = { ...lessonProgress(), attempts: -1 } as LessonProgress;
    expect(() => new LessonLibraryService(catalogue, sampleDog.id, [invalid]).getAllLessons()).toThrow(expect.objectContaining<Partial<LessonLibraryError>>({ code: 'CORRUPT_PROGRESS' }));

    const duplicate = { ...lessonProgress(), id: 'duplicate-progress-id' };
    expect(() => new LessonLibraryService(catalogue, sampleDog.id, [lessonProgress(), duplicate]).getAllLessons()).toThrow(expect.objectContaining<Partial<LessonLibraryError>>({ code: 'CORRUPT_PROGRESS' }));

    const missingReference = lessonProgress({ lessonId: 'missing-lesson-reference' });
    expect(() => new LessonLibraryService(catalogue, sampleDog.id, [missingReference]).getAllLessons()).toThrow(expect.objectContaining<Partial<LessonLibraryError>>({ code: 'CORRUPT_PROGRESS' }));
  });

  it('throws a typed error for an invalid lesson ID', () => {
    const service = new LessonLibraryService(catalogue, sampleDog.id, []);
    expect(() => service.getLessonSummary('missing-library-lesson')).toThrow(expect.objectContaining<Partial<LessonLibraryError>>({ code: 'LESSON_NOT_FOUND', context: { lessonId: 'missing-library-lesson' } }));
  });
});
