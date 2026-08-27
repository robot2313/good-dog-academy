import type { BehaviourSkill, TrainingOutcome } from '../../../domain/models';

export type TrainingHistoryRatingBand = '1-2' | '3' | '4-5';

export type TrainingHistoryEntry = {
  readonly sessionId: string;
  readonly dogId: string;
  readonly lessonId: string;
  readonly dailyPlanId: string | null;
  readonly lessonTitle: string;
  readonly lessonAvailable: boolean;
  readonly skill: BehaviourSkill | null;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly localDate: string;
  readonly durationMinutes: number;
  readonly outcome: TrainingOutcome;
  readonly notes: string;
  readonly exactRating: null;
  readonly ratingBand: TrainingHistoryRatingBand;
};

export type ListTrainingHistoryRequest = {
  readonly ownerId: string;
  readonly dogId: string;
  readonly timeZone: string;
  readonly offset?: number;
  readonly limit?: number;
};

export type GetTrainingHistoryEntryRequest = {
  readonly ownerId: string;
  readonly dogId: string;
  readonly sessionId: string;
  readonly timeZone: string;
};

export type TrainingHistoryPage = {
  readonly entries: readonly TrainingHistoryEntry[];
  readonly totalCount: number;
  readonly excludedIncompleteCount: number;
  readonly offset: number;
  readonly limit: number;
  readonly hasMore: boolean;
};
