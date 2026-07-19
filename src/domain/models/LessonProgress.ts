import type { LessonId } from './LessonDefinition';

export type LessonProgressStatus = 'locked' | 'available' | 'inProgress' | 'completed';
export type LessonPerformanceRating = 1 | 2 | 3 | 4 | 5;
export type LessonDifficultyAdjustment = -2 | -1 | 0 | 1 | 2;

export type LessonProgress = {
  id: string;
  ownerId: string;
  dogId: string;
  lessonId: LessonId;
  status: LessonProgressStatus;
  attempts: number;
  successfulCompletions: number;
  lastAttemptedAt: string | null;
  lastCompletedAt: string | null;
  bestPerformanceRating: LessonPerformanceRating | null;
  currentDifficultyAdjustment: LessonDifficultyAdjustment;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
