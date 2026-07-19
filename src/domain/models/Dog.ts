export type DogSex = 'female' | 'male' | 'unknown';

export type Dog = {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  dateOfBirth: string | null;
  sex: DogSex;
  weightKg: number | null;
  createdAt: string;
  updatedAt: string;
};
