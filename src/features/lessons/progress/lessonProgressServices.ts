import { appStorage } from '../../../services/appStorage';
import { StorageTransactionManager } from '../../../storage/StorageTransactionManager';
import { createLocalId } from '../../../utils/ids';
import { loadBundledLessonCatalogue } from '../catalogue';
import { LessonProgressInitializationService } from './LessonProgressInitializationService';
import { LessonSessionCompletionService } from './LessonSessionCompletionService';
import { TrainingSessionNotesService } from '../../progress/TrainingSessionNotesService';

export const lessonProgressInitializationService = new LessonProgressInitializationService(
  new StorageTransactionManager(appStorage),
  loadBundledLessonCatalogue(),
  createLocalId,
  () => new Date().toISOString(),
);

export const lessonSessionCompletionService = new LessonSessionCompletionService(
  new StorageTransactionManager(appStorage),
  loadBundledLessonCatalogue(),
  createLocalId,
  () => new Date().toISOString(),
);

export const trainingSessionNotesService = new TrainingSessionNotesService(new StorageTransactionManager(appStorage));
