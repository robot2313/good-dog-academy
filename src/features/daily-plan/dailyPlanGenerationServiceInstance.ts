import { appStorage } from '../../services/appStorage';
import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { loadBundledLessonCatalogue } from '../lessons/catalogue';
import { DailyPlanGenerationService } from './DailyPlanGenerationService';

export const dailyPlanGenerationService = new DailyPlanGenerationService(
  new StorageTransactionManager(appStorage),
  loadBundledLessonCatalogue(),
);

export async function getOrCreateDefaultDailyPlan(ownerId: string, dogId: string, timezone: string) {
  return dailyPlanGenerationService.getOrCreate({ ownerId, dogId, timezone, targetMinutes: 15 });
}
