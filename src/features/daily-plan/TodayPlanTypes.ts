import type {
  BehaviourSkill,
  DailyPlanItemRole,
  DailyPlanStatus,
  DailyPlanTargetMinutes,
  LessonDifficultyLevel,
  LessonId,
} from '../../domain/models';

export type TodayPlanItemView = {
  readonly lessonId: LessonId;
  readonly title: string;
  readonly description: string;
  readonly skill: BehaviourSkill;
  readonly difficultyLevel: LessonDifficultyLevel | null;
  readonly role: DailyPlanItemRole;
  readonly plannedMinutes: number;
  readonly completed: boolean;
  readonly lessonAvailable: boolean;
};

export type TodayPlanView = {
  readonly id: string;
  readonly ownerId: string;
  readonly dogId: string;
  readonly localDate: string;
  readonly timezone: string;
  readonly targetMinutes: DailyPlanTargetMinutes;
  readonly estimatedMinutes: number;
  readonly focusSkill: BehaviourSkill;
  readonly status: DailyPlanStatus;
  readonly items: readonly TodayPlanItemView[];
  readonly completedItemCount: number;
  readonly stale: boolean;
};

export type TodayPlanRequest = {
  readonly ownerId: string;
  readonly dogId: string;
  readonly timezone: string;
};
