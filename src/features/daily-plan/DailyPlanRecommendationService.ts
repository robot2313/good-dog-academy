import type {
  BehaviourProfile,
  BehaviourSkill,
  DailyPlan,
  DailyPlanTargetMinutes,
  LessonDefinition,
  LessonId,
  LessonProgress,
} from '../../domain/models';
import type { LessonCatalogue } from '../lessons/catalogue';
import { LessonEligibilityService } from '../lessons/eligibility';

export type DailyPlanRecommendationKind = 'new-learning' | 'reinforcement';

export type DailyPlanRecommendation = {
  lessonId: LessonId;
  kind: DailyPlanRecommendationKind;
  skill: BehaviourSkill;
  estimatedMinutes: number;
  priorityScore: number;
  reasons: readonly DailyPlanRecommendationReason[];
};

export type DailyPlanRecommendationReason =
  | 'LOW_SKILL_SCORE'
  | 'UNKNOWN_SKILL'
  | 'IN_PROGRESS'
  | 'AVAILABLE_NEW_LEARNING'
  | 'NEEDS_PRACTICE'
  | 'REINFORCEMENT_DUE'
  | 'RECENTLY_PLANNED_PENALTY';

export type DailyPlanRecommendationRequest = {
  dogAgeMonths: number;
  behaviourProfile: BehaviourProfile;
  progressRecords: readonly LessonProgress[];
  targetMinutes?: DailyPlanTargetMinutes;
  maximumLessons?: number;
  recentPlans?: readonly DailyPlan[];
};

export type DailyPlanRecommendationResult = {
  recommendations: readonly DailyPlanRecommendation[];
  totalEstimatedMinutes: number;
  targetMinutes: number;
};

const DEFAULT_TARGET_MINUTES = 15;
const DEFAULT_MAXIMUM_LESSONS = 2;
const SUPPORTED_TARGETS = [5, 10, 15, 20, 30] as const;
const UNKNOWN_SKILL_SCORE = 50;

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function daysSince(value: string | null, nowMs: number): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor((nowMs - parsed) / 86_400_000));
}

export class DailyPlanRecommendationService {
  private readonly eligibility: LessonEligibilityService;

  constructor(
    private readonly catalogue: LessonCatalogue,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.eligibility = new LessonEligibilityService(catalogue);
  }

  recommend(request: DailyPlanRecommendationRequest): DailyPlanRecommendationResult {
    const targetMinutes = request.targetMinutes ?? DEFAULT_TARGET_MINUTES;
    const maximumLessons = request.maximumLessons ?? DEFAULT_MAXIMUM_LESSONS;

    if (!SUPPORTED_TARGETS.includes(targetMinutes)) {
      throw new RangeError('targetMinutes must be one of 5, 10, 15, 20, or 30');
    }
    if (!Number.isInteger(maximumLessons) || maximumLessons <= 0 || maximumLessons > 2) {
      throw new RangeError('maximumLessons must be one or two');
    }
    if (!Number.isFinite(request.dogAgeMonths) || request.dogAgeMonths < 0) {
      throw new RangeError('dogAgeMonths must be a non-negative number');
    }

    const progressByLesson = new Map(request.progressRecords.map((progress) => [progress.lessonId, progress]));
    const nowMs = this.now().getTime();

    const ranked = this.catalogue.definitions
      .map((definition) => this.toCandidate(definition, request, progressByLesson.get(definition.id), nowMs))
      .filter((candidate): candidate is DailyPlanRecommendation => candidate !== null)
      .sort((a, b) =>
        b.priorityScore - a.priorityScore
        || a.estimatedMinutes - b.estimatedMinutes
        || compareIds(a.lessonId, b.lessonId),
      );

    const selected: DailyPlanRecommendation[] = [];
    const selectedSkills = new Set<BehaviourSkill>();
    let totalEstimatedMinutes = 0;

    for (const candidate of ranked) {
      if (selected.length >= maximumLessons) break;
      if (selectedSkills.has(candidate.skill)) continue;

      const wouldExceedTarget = totalEstimatedMinutes + candidate.estimatedMinutes > targetMinutes;
      if (wouldExceedTarget && selected.length > 0) continue;

      selected.push(candidate);
      selectedSkills.add(candidate.skill);
      totalEstimatedMinutes += candidate.estimatedMinutes;
    }

    return Object.freeze({
      recommendations: Object.freeze(selected),
      totalEstimatedMinutes,
      targetMinutes,
    });
  }

  private toCandidate(
    definition: LessonDefinition,
    request: DailyPlanRecommendationRequest,
    progress: LessonProgress | undefined,
    nowMs: number,
  ): DailyPlanRecommendation | null {
    const eligibility = this.eligibility.evaluate(definition.id, request.dogAgeMonths, request.progressRecords);
    if (!eligibility.eligible) return null;

    const reasons: DailyPlanRecommendationReason[] = [];
    const isUnknownSkill = request.behaviourProfile.unknownSkills.includes(definition.skill);
    const skillScore = isUnknownSkill
      ? UNKNOWN_SKILL_SCORE
      : request.behaviourProfile.skillScores[definition.skill];

    let priorityScore = 100 - skillScore;

    if (skillScore <= 50) reasons.push('LOW_SKILL_SCORE');
    if (isUnknownSkill) {
      reasons.push('UNKNOWN_SKILL');
      priorityScore += 8;
    }

    let kind: DailyPlanRecommendationKind;
    if (eligibility.canBeNewLearning) {
      kind = 'new-learning';
      reasons.push(progress?.status === 'inProgress' ? 'IN_PROGRESS' : 'AVAILABLE_NEW_LEARNING');
      priorityScore += progress?.status === 'inProgress' ? 25 : 15;

      if ((progress?.attempts ?? 0) > (progress?.successfulCompletions ?? 0)) {
        reasons.push('NEEDS_PRACTICE');
        priorityScore += Math.min(15, ((progress?.attempts ?? 0) - (progress?.successfulCompletions ?? 0)) * 3);
      }
    } else {
      kind = 'reinforcement';
      reasons.push('REINFORCEMENT_DUE');
      const recencyDays = daysSince(progress?.lastCompletedAt ?? null, nowMs);
      priorityScore += Math.min(20, recencyDays ?? 20);
    }

    // Prefer simpler content when two lessons serve a similar need.
    priorityScore -= (definition.difficultyLevel - 1) * 2;

    const recentOccurrences = (request.recentPlans ?? [])
      .flatMap((plan) => plan.items)
      .filter((item) => item.lessonId === definition.id).length;
    if (recentOccurrences > 0) {
      reasons.push('RECENTLY_PLANNED_PENALTY');
      priorityScore -= recentOccurrences * 30;
    }

    return Object.freeze({
      lessonId: definition.id,
      kind,
      skill: definition.skill,
      estimatedMinutes: definition.estimatedMinutes,
      priorityScore,
      reasons: Object.freeze(reasons),
    });
  }
}
