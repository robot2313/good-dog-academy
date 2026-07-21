import { appStorage } from '../../../services/appStorage';
import { StorageTransactionManager } from '../../../storage/StorageTransactionManager';
import { createLocalId } from '../../../utils/ids';
import { loadBundledLessonCatalogue } from '../catalogue';
import { LessonProgressInitializationService } from './LessonProgressInitializationService';

export const lessonProgressInitializationService = new LessonProgressInitializationService(
  new StorageTransactionManager(appStorage),
  loadBundledLessonCatalogue(),
  createLocalId,
  () => new Date().toISOString(),
);
