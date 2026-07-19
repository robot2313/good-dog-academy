import type { LessonDefinition, LessonProgress } from '../../src/domain/models';
import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';

export const foundationLesson: LessonDefinition = {
  id: 'lesson:foundation-focus', contentVersion: '1.0.0', title: 'Fixture Foundation Focus', shortDescription: 'Test-only foundation definition.',
  skill: 'focus', category: 'foundation', difficultyLevel: 1, estimatedMinutes: 5, goal: 'Verify catalogue behaviour.',
  equipment: [], prerequisites: [], minimumDogAgeMonths: null, steps: ['Run the test step.'], tips: [], commonMistakes: [],
  troubleshooting: [], safetyNotes: [], completionCriteria: { minimumSuccessfulCompletions: 1, minimumPerformanceRating: null },
  tags: ['foundation'], isActive: true,
};

export const recallLesson: LessonDefinition = {
  ...foundationLesson, id: 'lesson:recall-with-prerequisite', title: 'Fixture Recall', skill: 'recall', category: 'life-skills', difficultyLevel: 2,
  prerequisites: [{ lessonId: foundationLesson.id, minimumSuccessfulCompletions: 1 }], tags: ['recall'],
};

export const advancedLesson: LessonDefinition = {
  ...foundationLesson, id: 'lesson:advanced-control', title: 'Fixture Advanced Control', skill: 'impulse-control', category: 'behaviour', difficultyLevel: 3,
  prerequisites: [
    { lessonId: foundationLesson.id, minimumSuccessfulCompletions: 1 },
    { lessonId: recallLesson.id, minimumSuccessfulCompletions: 2 },
  ], tags: ['impulse-control'],
};

export const lessonDefinitions = [advancedLesson, recallLesson, foundationLesson] as const;

export function lessonProgress(overrides: Partial<LessonProgress> = {}): LessonProgress {
  return {
    id: 'lesson-progress-fixture-001', ownerId: sampleOwner.id, dogId: sampleDog.id, lessonId: foundationLesson.id,
    status: 'available', attempts: 0, successfulCompletions: 0, lastAttemptedAt: null, lastCompletedAt: null,
    bestPerformanceRating: null, currentDifficultyAdjustment: 0, unlockedAt: '2026-07-19T00:00:00.000Z',
    createdAt: '2026-07-19T00:00:00.000Z', updatedAt: '2026-07-19T00:00:00.000Z', ...overrides,
  };
}
