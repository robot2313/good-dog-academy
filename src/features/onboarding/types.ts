import type { DogEnergyLevel, DogSex, PrimaryGoal, TrainingExperience, WeightUnit } from '../../domain/models';

export type OwnerFormData = {
  displayName: string;
  trainingExperience: TrainingExperience | null;
  primaryGoal: PrimaryGoal | null;
};

export type DogFormData = {
  photoUri: string | null;
  name: string;
  breed: string;
  breedUnknown: boolean;
  birthdayEstimated: boolean;
  birthday: string;
  estimatedAgeYears: string;
  sex: DogSex | null;
  weight: string;
  weightUnit: WeightUnit;
  energyLevel: DogEnergyLevel | null;
};

export const emptyOwnerForm: OwnerFormData = {
  displayName: '',
  trainingExperience: null,
  primaryGoal: null,
};

export const emptyDogForm: DogFormData = {
  photoUri: null,
  name: '',
  breed: '',
  breedUnknown: false,
  birthdayEstimated: false,
  birthday: '',
  estimatedAgeYears: '',
  sex: null,
  weight: '',
  weightUnit: 'kg',
  energyLevel: null,
};
