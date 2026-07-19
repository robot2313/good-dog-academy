export type TrainingExperience = 'beginner' | 'intermediate' | 'experienced';
export type PrimaryGoal = 'family-companion' | 'basic-obedience' | 'behaviour-help' | 'adventure' | 'dog-sport';

export type Owner = {
  id: string;
  email: string | null;
  displayName: string;
  trainingExperience: TrainingExperience;
  primaryGoal: PrimaryGoal;
  createdAt: string;
  updatedAt: string;
};
