import type {
  Achievement,
  BehaviourProfile,
  DailyPlan,
  Dog,
  Lesson,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../domain/models';
import type { DomainRepositories } from '../domain/repositories';
import {
  validateAchievement,
  validateBehaviourProfile,
  validateDailyPlan,
  validateDog,
  validateLesson,
  validateNotificationSettings,
  validateOwner,
  validateProgress,
  validateTrainingSession,
} from '../domain/validation';
import { AsyncStorageRepository } from '../storage/AsyncStorageRepository';
import type { StorageAdapter } from '../storage/StorageAdapter';
import { storageKeys } from '../storage/storageKeys';

export function createDomainRepositories(storage: StorageAdapter): DomainRepositories {
  return {
    owners: new AsyncStorageRepository<Owner>(storage, storageKeys.owners, 'Owner', validateOwner),
    dogs: new AsyncStorageRepository<Dog>(storage, storageKeys.dogs, 'Dog', validateDog),
    behaviourProfiles: new AsyncStorageRepository<BehaviourProfile>(storage, storageKeys.behaviourProfiles, 'BehaviourProfile', validateBehaviourProfile),
    lessons: new AsyncStorageRepository<Lesson>(storage, storageKeys.lessons, 'Lesson', validateLesson),
    dailyPlans: new AsyncStorageRepository<DailyPlan>(storage, storageKeys.dailyPlans, 'DailyPlan', validateDailyPlan),
    trainingSessions: new AsyncStorageRepository<TrainingSession>(storage, storageKeys.trainingSessions, 'TrainingSession', validateTrainingSession),
    achievements: new AsyncStorageRepository<Achievement>(storage, storageKeys.achievements, 'Achievement', validateAchievement),
    progress: new AsyncStorageRepository<Progress>(storage, storageKeys.progress, 'Progress', validateProgress),
    notificationSettings: new AsyncStorageRepository<NotificationSettings>(storage, storageKeys.notificationSettings, 'NotificationSettings', validateNotificationSettings),
  };
}
