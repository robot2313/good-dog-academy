import type { BehaviourSkill, LessonDifficultyLevel } from '../../../domain/models';
import { LessonLibraryError } from './LessonLibraryError';
import type { LessonLibraryItem, LessonState } from './lessonLibraryTypes';

export const lessonStateLabels: Readonly<Record<LessonState, string>> = Object.freeze({
  AVAILABLE: 'Available',
  LOCKED: 'Locked',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
});

export const lessonDifficultyLabels: Readonly<Record<LessonDifficultyLevel, string>> = Object.freeze({
  1: 'Level 1',
  2: 'Level 2',
  3: 'Level 3',
  4: 'Level 4',
  5: 'Level 5',
});

export function skillLabel(skill: BehaviourSkill): string {
  return skill.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function lessonCardAccessibilityLabel(lesson: LessonLibraryItem, allowLockedSelection = false): string {
  const parts = [
    lesson.title,
    skillLabel(lesson.skill),
    lessonDifficultyLabels[lesson.difficulty],
    `${lesson.estimatedMinutes} minutes`,
    lesson.state === 'LOCKED' && allowLockedSelection ? 'Self-directed choice' : lessonStateLabels[lesson.state],
  ];
  if (lesson.state === 'LOCKED') parts.push(allowLockedSelection ? `${lesson.lock.reason} You can choose this lesson now` : lesson.lock.reason);
  return `${parts.map((part) => part.replace(/[.!?]+$/, '')).join('. ')}.`;
}

export function lessonLibraryErrorMessage(error: unknown): string {
  if (error instanceof LessonLibraryError) {
    if (error.code === 'MISSING_SELECTED_DOG') return 'No dog is currently selected. Return to setup or try again after choosing a dog.';
    if (error.code === 'CORRUPT_PROGRESS') return 'Training progress could not be read safely. Nothing was changed. Please try loading it again.';
    if (error.code === 'LESSON_NOT_FOUND') return 'This lesson is no longer available in the library.';
  }
  return 'The lesson library could not be loaded. Please try again.';
}
