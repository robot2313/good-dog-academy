import { createDomainRepositories } from '../../../services/createDomainRepositories';
import { appStorage } from '../../../services/appStorage';
import { loadBundledLessonCatalogue } from '../../lessons/catalogue';
import { TrainingHistoryQueryService } from './TrainingHistoryQueryService';

export const trainingHistoryQueryService = new TrainingHistoryQueryService(
  createDomainRepositories(appStorage),
  loadBundledLessonCatalogue(),
);
