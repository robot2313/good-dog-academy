import { appStorage } from '../../services/appStorage';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import { loadBundledLessonCatalogue } from '../lessons/catalogue';
import { dailyPlanGenerationService } from './dailyPlanGenerationServiceInstance';
import { TodayPlanService } from './TodayPlanService';

export const todayPlanService = new TodayPlanService(
  createDomainRepositories(appStorage),
  loadBundledLessonCatalogue(),
  dailyPlanGenerationService,
);
