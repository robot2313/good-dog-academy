import { domainRepositories } from '../../../services/domainRepositories';
import { loadBundledLessonCatalogue } from '../../lessons/catalogue';
import { DogLearningPassportQueryService } from './DogLearningPassportQueryService';

export const dogLearningPassportQueryService = new DogLearningPassportQueryService(
  domainRepositories,
  loadBundledLessonCatalogue(),
);
