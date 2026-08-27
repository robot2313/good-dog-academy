import { appStorage } from '../../../services/appStorage';
import { StorageTransactionManager } from '../../../storage/StorageTransactionManager';
import { createLocalId } from '../../../utils/ids';
import { loadBundledLessonCatalogue } from '../catalogue';
import { LessonProgressInitializationService } from './LessonProgressInitializationService';
import { LessonSessionCompletionService } from './LessonSessionCompletionService';

const transactions = new StorageTransactionManager(appStorage);
const catalogue = loadBundledLessonCatalogue();

export const lessonProgressInitializationService =
  new LessonProgressInitializationService(
    transactions,
    catalogue,
    createLocalId,
    () => new Date().toISOString(),
  );

export const lessonSessionCompletionService =
  new LessonSessionCompletionService(
    transactions,
    catalogue,
    () => new Date().toISOString(),
  );
