import type { Achievement, LessonPerformanceRating, LessonProgress, Progress, TrainingOutcome, TrainingSession } from '../../../domain/models';
import { buildProgress, earnAchievements } from '../../progress/ProgressIntelligence';
import { createDomainRepositories } from '../../../services/createDomainRepositories';
import { StorageTransactionManager } from '../../../storage/StorageTransactionManager';
import { storageKeys } from '../../../storage/storageKeys';
import type { LessonCatalogue } from '../catalogue';
import { LessonUnlockService } from './LessonUnlockService';

const completionKeys = [storageKeys.lessonProgress, storageKeys.trainingSessions, storageKeys.progress, storageKeys.achievements, storageKeys.dailyPlans] as const;

export class LessonSessionCompletionService {
  constructor(
    private readonly transactions: StorageTransactionManager,
    private readonly catalogue: LessonCatalogue,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
  ) {}

  async complete(lessonId: string, dogId: string, rating: LessonPerformanceRating, dailyPlanId: string | null = null): Promise<{ progress: LessonProgress[]; session: TrainingSession; summary: Progress; achievements: Achievement[] }> {
    return this.transactions.run(completionKeys, async (storage) => {
      const repositories = createDomainRepositories(storage);
      const records = (await repositories.lessonProgress.findAll()).filter((record) => record.dogId === dogId);
      const current = records.find((record) => record.lessonId === lessonId);
      const lesson = this.catalogue.findById(lessonId);
      if (!current || !lesson || current.status === 'locked') throw new Error('Lesson is not available for completion.');

      const timestamp = this.now();
      const successful = rating >= 3;
      const attempted: LessonProgress = {
        ...current,
        attempts: current.attempts + 1,
        successfulCompletions: current.successfulCompletions + (successful ? 1 : 0),
        lastAttemptedAt: timestamp,
        lastCompletedAt: successful ? timestamp : current.lastCompletedAt,
        bestPerformanceRating: Math.max(current.bestPerformanceRating ?? 0, rating) as LessonPerformanceRating,
        updatedAt: timestamp,
      };
      const attemptedRecords = records.map((record) => record.id === current.id ? attempted : record);
      const statuses = new LessonUnlockService(this.catalogue).determineStatuses(attemptedRecords);
      const progress = attemptedRecords.map((record) => {
        const status = statuses.get(record.lessonId) ?? record.status;
        return { ...record, status, unlockedAt: status === 'locked' ? null : record.unlockedAt ?? timestamp, updatedAt: timestamp };
      });
      for (const record of progress) await repositories.lessonProgress.save(record);

      const outcome: TrainingOutcome = rating >= 4 ? 'success' : rating === 3 ? 'partial-success' : 'unsuccessful';
      const session: TrainingSession = {
        id: this.createId('training-session'), dogId, lessonId, dailyPlanId,
        startedAt: new Date(Date.parse(timestamp) - lesson.estimatedMinutes * 60_000).toISOString(),
        completedAt: timestamp, durationMinutes: lesson.estimatedMinutes, outcome, notes: '',
      };
      await repositories.trainingSessions.save(session);

      const sessions = [...(await repositories.trainingSessions.findAll()).filter((item) => item.dogId === dogId && item.id !== session.id), session];
      const existingSummary = (await repositories.progress.findAll()).find((item) => item.dogId === dogId) ?? null;
      const summary = buildProgress(existingSummary, dogId, sessions, progress.filter((item) => item.status === 'completed').map((item) => item.lessonId), timestamp, this.createId);
      await repositories.progress.save(summary);
      const existingAchievements = (await repositories.achievements.findAll()).filter((item) => item.dogId === dogId);
      const earned = earnAchievements(existingAchievements, summary, timestamp, this.createId);
      for (const achievement of earned) await repositories.achievements.save(achievement);

      if (dailyPlanId) {
        const plan = await repositories.dailyPlans.findById(dailyPlanId);
        if (plan && plan.dogId === dogId) {
          const completedPlanLessons = new Set(sessions.filter((item) => item.dailyPlanId === plan.id && item.completedAt).map((item) => item.lessonId));
          await repositories.dailyPlans.save({ ...plan, status: plan.lessonIds.every((id) => completedPlanLessons.has(id)) ? 'completed' : 'in-progress', updatedAt: timestamp });
        }
      }

      return { progress, session, summary, achievements: [...existingAchievements, ...earned] };
    });
  }
}
