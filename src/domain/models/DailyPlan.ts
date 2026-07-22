import type { BehaviourSkill } from './BehaviourAssessment';
import type { LessonId } from './LessonDefinition';

export const dailyPlanTargetMinutes = [5, 10, 15, 20, 30] as const;
export type DailyPlanTargetMinutes = (typeof dailyPlanTargetMinutes)[number];
export type DailyPlanStatus = 'planned' | 'completed' | 'skipped';
export type DailyPlanItemRole = 'primary' | 'reinforcement';
export type DailyPlanReasonCode =
  | 'LOW_SKILL_SCORE'
  | 'UNKNOWN_SKILL'
  | 'IN_PROGRESS'
  | 'AVAILABLE_NEW_LEARNING'
  | 'NEEDS_PRACTICE'
  | 'REINFORCEMENT_DUE'
  | 'RECENTLY_PLANNED_PENALTY';

export type DailyPlanItem = {
  lessonId: LessonId;
  skill: BehaviourSkill;
  role: DailyPlanItemRole;
  plannedMinutes: number;
  reasonCodes: readonly DailyPlanReasonCode[];
  order: 1 | 2;
};

export type DailyPlan = {
  id: string;
  ownerId: string;
  dogId: string;
  localDate: string;
  timezone: string;
  targetMinutes: DailyPlanTargetMinutes;
  estimatedMinutes: number;
  focusSkill: BehaviourSkill;
  items: readonly DailyPlanItem[];
  status: DailyPlanStatus;
  sourceAssessmentId: string;
  generatedAt: string;
  createdAt: string;
  updatedAt: string;
};
