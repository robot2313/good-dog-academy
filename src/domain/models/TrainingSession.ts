import type { TrainingRep } from './TrainingEvidence';

export type TrainingOutcome = 'success' | 'partial-success' | 'unsuccessful';

export type TrainingSession = {
  id: string;
  dogId: string;
  lessonId: string;
  dailyPlanId: string | null;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number;
  outcome: TrainingOutcome | null;
  notes: string;
  reps?: TrainingRep[];
};
