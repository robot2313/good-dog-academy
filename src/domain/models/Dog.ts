export type DogSex = 'female' | 'male' | 'unknown';
export type WeightUnit = 'kg' | 'lb';
export type DogEnergyLevel = 'low' | 'medium' | 'high';

export type Dog = {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  breedUnknown: boolean;
  dateOfBirth: string | null;
  birthdayEstimated: boolean;
  estimatedAgeYears: number | null;
  sex: DogSex;
  weightKg: number | null;
  weightUnit: WeightUnit;
  energyLevel: DogEnergyLevel;
  photoUri: string | null;
  createdAt: string;
  updatedAt: string;
};
