export const troubleshooterTopicIds = [
  'recall',
  'name-response',
  'sit',
  'stay',
  'loose-lead-walking',
  'settling',
  'jumping',
  'barking',
  'focus',
  'chewing',
  'reactivity',
  'house-training',
  'confidence',
] as const;

export type TroubleshooterTopicId = (typeof troubleshooterTopicIds)[number];

export const troubleshooterFailureCategories = [
  'high_distraction',
  'difficulty_increased_too_quickly',
  'reward_not_effective',
  'cue_not_understood',
  'not_generalised',
  'handler_timing_or_cue_issue',
  'session_too_long_or_dog_disengaged',
  'overexcited_frustrated_or_fearful',
] as const;

export type TroubleshooterFailureCategory = (typeof troubleshooterFailureCategories)[number];

export const troubleshooterOutcomes = [
  'worse',
  'no-change',
  'slightly-better',
  'successful-once',
  'successful-three-times',
  'reliable',
] as const;

export type TroubleshooterOutcome = (typeof troubleshooterOutcomes)[number];
export type TroubleshooterFallbackLevel = 1 | 2 | 3;

export type TroubleshooterAttempt = {
  id: string;
  ownerId: string;
  dogId: string;
  topicId: TroubleshooterTopicId;
  scenarioId: string;
  failureCategory: TroubleshooterFailureCategory;
  protocolId: string;
  protocolVersion: number;
  fallbackLevel: TroubleshooterFallbackLevel;
  outcome: TroubleshooterOutcome;
  environment: string;
  createdAt: string;
};
