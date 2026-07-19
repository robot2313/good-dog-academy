export type DailyPlanStatus = 'scheduled' | 'in-progress' | 'completed' | 'skipped';

export type DailyPlan = {
  id: string;
  dogId: string;
  date: string;
  lessonIds: string[];
  status: DailyPlanStatus;
  createdAt: string;
  updatedAt: string;
};
