import { behaviourSkills, type BehaviourSkill, type LessonDifficultyLevel, type LessonId, type LessonProgress, type LessonProgressStatus } from '../../../domain/models';
import type { LessonCatalogue } from '../catalogue';
import { LessonUnlockService } from '../progress';

export type LessonEligibilityReason =
  | 'INACTIVE_LESSON'
  | 'UNKNOWN_SKILL'
  | 'DOG_BELOW_MINIMUM_AGE'
  | 'PREREQUISITES_NOT_MET'
  | 'LESSON_LOCKED'
  | 'COMPLETED_REINFORCEMENT_ONLY';

export type LessonEligibilityResult = {
  lessonId: LessonId;
  eligible: boolean;
  reasons: readonly LessonEligibilityReason[];
  skill: BehaviourSkill;
  difficultyLevel: LessonDifficultyLevel;
  status: LessonProgressStatus;
  prerequisitesMet: boolean;
  ageEligible: boolean;
  isActive: boolean;
  isKnownSkill: boolean;
  canBeNewLearning: boolean;
  canBeReinforcement: boolean;
};

export class LessonEligibilityError extends Error {
  constructor(readonly code: 'MISSING_LESSON_REFERENCE', readonly context: Record<string, unknown>) {
    super(code);
    this.name = 'LessonEligibilityError';
  }
}

export class LessonEligibilityService {
  constructor(private readonly catalogue: LessonCatalogue) {}

  evaluate(lessonId: LessonId, dogAgeMonths: number, progressRecords: readonly LessonProgress[]): LessonEligibilityResult {
    const definition = this.catalogue.findById(lessonId);
    if (!definition) throw new LessonEligibilityError('MISSING_LESSON_REFERENCE', { lessonId });

    const statuses = new LessonUnlockService(this.catalogue).determineStatuses(progressRecords);
    const status = statuses.get(lessonId) ?? 'locked';
    const byLesson = new Map(progressRecords.map((progress) => [progress.lessonId, progress]));
    const prerequisitesMet = definition.prerequisites.every((prerequisite) => (byLesson.get(prerequisite.lessonId)?.successfulCompletions ?? 0) >= prerequisite.minimumSuccessfulCompletions);
    const ageEligible = definition.minimumDogAgeMonths === null || dogAgeMonths >= definition.minimumDogAgeMonths;
    const isKnownSkill = behaviourSkills.includes(definition.skill);
    const canBeNewLearning = definition.isActive && isKnownSkill && ageEligible && prerequisitesMet && (status === 'available' || status === 'inProgress');
    const canBeReinforcement = definition.isActive && isKnownSkill && ageEligible && status === 'completed';
    const reasons: LessonEligibilityReason[] = [];
    if (!definition.isActive) reasons.push('INACTIVE_LESSON');
    if (!isKnownSkill) reasons.push('UNKNOWN_SKILL');
    if (!ageEligible) reasons.push('DOG_BELOW_MINIMUM_AGE');
    if (!prerequisitesMet) reasons.push('PREREQUISITES_NOT_MET');
    if (status === 'locked') reasons.push('LESSON_LOCKED');
    if (status === 'completed') reasons.push('COMPLETED_REINFORCEMENT_ONLY');

    return Object.freeze({ lessonId, eligible: canBeNewLearning || canBeReinforcement, reasons: Object.freeze(reasons), skill: definition.skill, difficultyLevel: definition.difficultyLevel, status, prerequisitesMet, ageEligible, isActive: definition.isActive, isKnownSkill, canBeNewLearning, canBeReinforcement });
  }
}
