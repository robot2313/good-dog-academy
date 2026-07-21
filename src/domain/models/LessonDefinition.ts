import type { BehaviourSkill } from './BehaviourAssessment';

export type LessonId = string;
export type LessonContentVersion = number;
export type LessonCategory = 'foundation' | 'life-skills' | 'behaviour' | 'safety';
export type LessonDifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type LessonTag = 'foundation' | 'home' | 'outdoors' | 'walking' | 'recall' | 'loose-lead-walking' | 'focus' | 'jumping' | 'barking' | 'chewing' | 'reactivity' | 'house-training' | 'impulse-control' | 'confidence' | 'safety';

export type LessonPrerequisite = {
  lessonId: LessonId;
  minimumSuccessfulCompletions: number;
};

export type LessonTroubleshooting = {
  problem: string;
  solution: string;
};

export type LessonCompletionCriteria = {
  description: string;
  minimumSuccessfulCompletions: number;
  minimumPerformanceRating: 1 | 2 | 3 | 4 | 5 | null;
};

export type LessonDefinition = {
  id: LessonId;
  contentVersion: LessonContentVersion;
  title: string;
  shortDescription: string;
  skill: BehaviourSkill;
  category: LessonCategory;
  difficultyLevel: LessonDifficultyLevel;
  estimatedMinutes: number;
  goal: string;
  equipment: readonly string[];
  prerequisites: readonly LessonPrerequisite[];
  minimumDogAgeMonths: number | null;
  steps: readonly string[];
  tips: readonly string[];
  commonMistakes: readonly string[];
  troubleshooting: readonly LessonTroubleshooting[];
  safetyNotes: readonly string[];
  completionCriteria: LessonCompletionCriteria;
  tags: readonly LessonTag[];
  isActive: boolean;
};
