import type {
  BehaviourSkill,
  LessonId,
  TroubleshooterFailureCategory,
  TroubleshooterFallbackLevel,
  TroubleshooterOutcome,
  TroubleshooterTopicId,
} from '../../domain/models';
import type { LessonLibraryItem } from '../lessons/library/lessonLibraryTypes';

export type TroubleshooterScenario = {
  readonly id: string;
  readonly label: string;
  readonly failureCategory: TroubleshooterFailureCategory;
  readonly selectionReason: string;
};

export type TroubleshooterConcern = {
  readonly id: TroubleshooterTopicId;
  readonly lessonSkill: BehaviourSkill;
  readonly title: string;
  readonly description: string;
  readonly scenarios: readonly TroubleshooterScenario[];
};

export type TroubleshooterBodyState =
  | 'relaxed-and-engaged'
  | 'excited-or-frustrated'
  | 'worried-or-avoiding'
  | 'panic-snapping-or-aggression'
  | 'possible-pain-or-sudden-change'
  | 'injury-child-or-control-risk';

export type TroubleshooterResponseState =
  | 'can-eat-and-respond'
  | 'distraction-too-strong'
  | 'difficulty-was-increased'
  | 'usual-reward-not-working'
  | 'cue-seems-unclear'
  | 'works-only-in-familiar-place'
  | 'timing-or-visible-help'
  | 'disengages-quickly';

export type TroubleshooterDiagnosticAnswers = {
  readonly topicId: TroubleshooterTopicId;
  readonly scenarioId: string;
  readonly bodyState: TroubleshooterBodyState;
  readonly responseState: TroubleshooterResponseState;
  readonly environment: string;
};

export type TroubleshooterExercise = {
  readonly title: string;
  readonly minutes: string;
  readonly setup: readonly string[];
  readonly steps: readonly string[];
  readonly repetitions: string;
};

export type TroubleshooterProtocol = {
  readonly id: string;
  readonly topicId: TroubleshooterTopicId;
  readonly protocolVersion: number;
  readonly reviewStatus: 'professional-review-required';
  readonly likelyObstacle: string;
  readonly explanation: readonly string[];
  readonly why: readonly string[];
  readonly primaryAdjustment: string;
  readonly exercise: TroubleshooterExercise;
  readonly difficultySigns: readonly string[];
  readonly successCriteria: readonly string[];
  readonly stopConditions: readonly string[];
  readonly fallbackLevel2: readonly string[];
  readonly fallbackLevel3: readonly string[];
  readonly professionalEscalation: string;
  readonly relatedLessonIds: readonly LessonId[];
};

export type TroubleshooterSafetyOverride = {
  readonly title: string;
  readonly message: string;
  readonly actions: readonly string[];
  readonly urgency: 'urgent' | 'prompt';
};

export type TroubleshooterRecommendation = {
  readonly lesson: LessonLibraryItem;
  readonly reason: string;
};

export type ResolvedTroubleshooterResult = {
  readonly concern: TroubleshooterConcern;
  readonly scenario: TroubleshooterScenario;
  readonly failureCategory: TroubleshooterFailureCategory;
  readonly fallbackLevel: TroubleshooterFallbackLevel;
  readonly protocol: TroubleshooterProtocol;
  readonly likelyObstacle: string;
  readonly primaryAdjustment: string;
  readonly exercise: TroubleshooterExercise;
  readonly selectionExplanation: string;
  readonly progressMessage: string | null;
  readonly safetyOverride: TroubleshooterSafetyOverride | null;
  readonly primaryLesson: TroubleshooterRecommendation | null;
  readonly alternativeLessons: readonly TroubleshooterRecommendation[];
};

export const bodyStateOptions: readonly { id: TroubleshooterBodyState; label: string }[] = Object.freeze([
  { id: 'relaxed-and-engaged', label: 'Mostly relaxed and able to participate' },
  { id: 'excited-or-frustrated', label: 'Very excited, restless, or frustrated' },
  { id: 'worried-or-avoiding', label: 'Worried, tense, freezing, or avoiding' },
  { id: 'panic-snapping-or-aggression', label: 'Panicking, lunging, growling, or snapping' },
  { id: 'possible-pain-or-sudden-change', label: 'This started suddenly or pain may be involved' },
  { id: 'injury-child-or-control-risk', label: 'Someone could be injured, a child is involved, or I may lose control' },
]);

export const responseStateOptions: readonly { id: TroubleshooterResponseState; label: string }[] = Object.freeze([
  { id: 'can-eat-and-respond', label: 'Can eat and respond to an easy cue' },
  { id: 'distraction-too-strong', label: 'The distraction seems stronger than the skill' },
  { id: 'difficulty-was-increased', label: 'Duration, distance, or difficulty increased recently' },
  { id: 'usual-reward-not-working', label: 'The usual reward is not valuable here' },
  { id: 'cue-seems-unclear', label: 'Seems unsure what the cue means' },
  { id: 'works-only-in-familiar-place', label: 'Can do it only in a familiar easy place' },
  { id: 'timing-or-visible-help', label: 'Needs visible food, a big signal, or repeated help' },
  { id: 'disengages-quickly', label: 'Loses interest or disengages quickly' },
]);

export const outcomeOptions: readonly { id: TroubleshooterOutcome; label: string }[] = Object.freeze([
  { id: 'worse', label: 'Worse' },
  { id: 'no-change', label: 'No change' },
  { id: 'slightly-better', label: 'Slightly better' },
  { id: 'successful-once', label: 'Successful once' },
  { id: 'successful-three-times', label: 'Successful three times' },
  { id: 'reliable', label: 'Reliable in this environment' },
]);
