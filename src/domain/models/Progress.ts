export type Progress = {
  id: string;
  dogId: string;
  completedLessonIds: string[];
  sessionsCompleted: number;
  currentStreakDays: number;
  bestStreakDays: number;
  totalTrainingMinutes: number;
  updatedAt: string;
};
