import { StorageTransactionManager } from '../../storage/StorageTransactionManager';
import { storageKeys } from '../../storage/storageKeys';
import { appStorage } from '../../services/appStorage';
import { createDomainRepositories } from '../../services/createDomainRepositories';
import {
  sampleAchievement,
  sampleBehaviourProfile,
  sampleBehaviourAssessment,
  sampleDailyPlan,
  sampleDog,
  sampleLessons,
  sampleNotificationSettings,
  sampleOwner,
  sampleProgress,
  sampleTrainingSession,
} from './sampleData';

const developmentSeedVersion = 2;
const seedKeys = [
  storageKeys.developmentSeedVersion,
  storageKeys.owners,
  storageKeys.dogs,
  storageKeys.behaviourProfiles,
  storageKeys.behaviourAssessments,
  storageKeys.lessons,
  storageKeys.dailyPlans,
  storageKeys.trainingSessions,
  storageKeys.achievements,
  storageKeys.progress,
  storageKeys.notificationSettings,
] as const;

export async function seedDevelopmentData(): Promise<void> {
  if (!__DEV__) throw new Error('Development seed data cannot run in a production build.');
  if (await appStorage.getItem<number>(storageKeys.developmentSeedVersion) === developmentSeedVersion) return;

  const transactions = new StorageTransactionManager(appStorage);
  await transactions.run(seedKeys, async (storage) => {
    const repositories = createDomainRepositories(storage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
    for (const lesson of sampleLessons) await repositories.lessons.save(lesson);
    await repositories.dailyPlans.save(sampleDailyPlan);
    await repositories.trainingSessions.save(sampleTrainingSession);
    await repositories.achievements.save(sampleAchievement);
    await repositories.progress.save(sampleProgress);
    await repositories.notificationSettings.save(sampleNotificationSettings);
    await storage.setItem(storageKeys.developmentSeedVersion, developmentSeedVersion);
  });
}
