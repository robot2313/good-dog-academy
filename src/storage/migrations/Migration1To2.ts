import type { Migration } from './Migration';
import { storageKeys } from '../storageKeys';

export const migration1To2: Migration = {
  fromVersion: 1,
  toVersion: 2,
  async migrate(storage) {
    const owners = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.owners);
    if (owners) {
      await storage.setItem(storageKeys.owners, owners.map((owner) => ({
        ...owner,
        email: owner.email ?? null,
        trainingExperience: owner.trainingExperience ?? 'beginner',
        primaryGoal: owner.primaryGoal ?? 'family-companion',
      })));
    }

    const dogs = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.dogs);
    if (dogs) {
      await storage.setItem(storageKeys.dogs, dogs.map((dog) => ({
        ...dog,
        breedUnknown: dog.breedUnknown ?? false,
        birthdayEstimated: dog.birthdayEstimated ?? false,
        estimatedAgeYears: dog.estimatedAgeYears ?? null,
        weightUnit: dog.weightUnit ?? 'kg',
        energyLevel: dog.energyLevel ?? 'medium',
        photoUri: dog.photoUri ?? null,
      })));
    }
  },
};
