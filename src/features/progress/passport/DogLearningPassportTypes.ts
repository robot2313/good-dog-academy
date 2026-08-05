import type { BehaviourSkill, TroubleshooterOutcome } from '../../../domain/models';

export type PassportEvidenceLevel = 'not-recorded' | 'started' | 'growing' | 'reliable';
export type PassportTimelineTone = 'positive' | 'neutral' | 'caution';

export type PassportSnapshot = {
  readonly completedLessons: number;
  readonly activeLessons: number;
  readonly completedSessions: number;
  readonly successfulSessions: number;
  readonly trainingMinutes: number;
  readonly recordedEnvironments: number;
};

export type PassportSkillRecord = {
  readonly skill: BehaviourSkill;
  readonly title: string;
  readonly evidenceLevel: PassportEvidenceLevel;
  readonly completedLessons: number;
  readonly activeLessons: number;
  readonly completedSessions: number;
  readonly successfulSessions: number;
  readonly helpAttempts: number;
  readonly improvingEnvironments: readonly string[];
  readonly reliableEnvironments: readonly string[];
  readonly latestHelpOutcome: TroubleshooterOutcome | null;
  readonly latestActivityAt: string | null;
};

export type PassportTimelineItem = {
  readonly id: string;
  readonly kind: 'training-session' | 'help-now';
  readonly title: string;
  readonly detail: string;
  readonly occurredAt: string;
  readonly localDate: string;
  readonly tone: PassportTimelineTone;
  readonly sessionId: string | null;
};

export type PassportNextStep = {
  readonly kind: 'lesson' | 'help-now' | 'academy';
  readonly title: string;
  readonly reason: string;
  readonly lessonId: string | null;
};

export type DogLearningPassport = {
  readonly dogId: string;
  readonly snapshot: PassportSnapshot;
  readonly skills: readonly PassportSkillRecord[];
  readonly timeline: readonly PassportTimelineItem[];
  readonly nextStep: PassportNextStep;
};

export type GetDogLearningPassportRequest = {
  readonly ownerId: string;
  readonly dogId: string;
  readonly timeZone: string;
};
