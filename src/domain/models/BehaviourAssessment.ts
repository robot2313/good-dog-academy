export type BehaviourSkill =
  | 'recall'
  | 'loose-lead-walking'
  | 'jumping'
  | 'barking'
  | 'chewing'
  | 'reactivity'
  | 'house-training'
  | 'confidence'
  | 'impulse-control'
  | 'focus';

export const behaviourSkills: readonly BehaviourSkill[] = [
  'recall', 'loose-lead-walking', 'jumping', 'barking', 'chewing',
  'reactivity', 'house-training', 'confidence', 'impulse-control', 'focus',
] as const;

export type AssessmentOption = 'never' | 'rarely' | 'sometimes' | 'often' | 'almost-always' | 'not-sure';
export type ScoringDirection = 'positive' | 'negative';

export type AssessmentResponse = {
  questionId: string;
  skill: BehaviourSkill;
  selectedOption: AssessmentOption;
  frequencyValue: 0 | 1 | 2 | 3 | 4 | null;
  scoringDirection: ScoringDirection;
};

export type BehaviourAssessment = {
  id: string;
  ownerId: string;
  dogId: string;
  responses: AssessmentResponse[];
  calculatedScores: Record<BehaviourSkill, number>;
  unknownSkills: BehaviourSkill[];
  completedAt: string;
  schemaVersion: 1;
};
