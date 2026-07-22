import type { BehaviourSkill, LessonDifficultyLevel, LessonId } from '../../../domain/models';

export type LessonState = 'AVAILABLE' | 'LOCKED' | 'IN_PROGRESS' | 'COMPLETED';

export type LessonLockDetails = {
  reason: string;
  missingPrerequisiteIds: readonly LessonId[];
  missingPrerequisiteNames: readonly string[];
};

type LessonLibraryMetadata = {
  id: LessonId;
  title: string;
  description: string;
  difficulty: LessonDifficultyLevel;
  estimatedMinutes: number;
  skill: BehaviourSkill;
  keywords: readonly string[];
};

export type LessonLibraryItem = LessonLibraryMetadata & (
  | { state: 'LOCKED'; lock: LessonLockDetails }
  | { state: Exclude<LessonState, 'LOCKED'>; lock: null }
);

export type LessonGroup = {
  skill: BehaviourSkill;
  title: string;
  lessons: readonly LessonLibraryItem[];
};

export type LessonFilter = {
  skill?: BehaviourSkill;
  difficulty?: LessonDifficultyLevel;
  state?: LessonState;
};
