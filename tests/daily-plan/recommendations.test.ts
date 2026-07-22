import type { BehaviourProfile, LessonDefinition } from '../../src/domain/models';
import { DailyPlanRecommendationService } from '../../src/features/daily-plan';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { lessonProgress } from '../support/lessonFixtures';

const createdAt = '2026-07-19T00:00:00.000Z';

function definition(overrides: Partial<LessonDefinition> & Pick<LessonDefinition, 'id' | 'title' | 'skill'>): LessonDefinition {
  return {
    contentVersion: 1,
    shortDescription: 'Recommendation fixture.',
    category: 'foundation',
    difficultyLevel: 1,
    estimatedMinutes: 5,
    goal: 'Test recommendation behaviour.',
    equipment: [],
    prerequisites: [],
    minimumDogAgeMonths: null,
    steps: ['Complete one clear repetition.'],
    tips: [],
    commonMistakes: [],
    troubleshooting: [],
    safetyNotes: [],
    completionCriteria: { description: 'Complete one repetition.', minimumSuccessfulCompletions: 1, minimumPerformanceRating: null },
    tags: ['foundation'],
    isActive: true,
    ...overrides,
  };
}

const recall = definition({ id: 'daily-recall', title: 'Recall', skill: 'recall', estimatedMinutes: 7 });
const focus = definition({ id: 'daily-focus', title: 'Focus', skill: 'focus', estimatedMinutes: 5 });
const lead = definition({ id: 'daily-lead', title: 'Lead', skill: 'loose-lead-walking', estimatedMinutes: 6 });
const secondRecall = definition({ id: 'daily-recall-two', title: 'Recall Two', skill: 'recall', estimatedMinutes: 4 });
const inactive = definition({ id: 'daily-inactive', title: 'Inactive', skill: 'jumping', isActive: false });

const profile: BehaviourProfile = {
  id: 'profile-1',
  dogId: 'dog-1',
  energyLevel: 'medium',
  foodMotivation: 'high',
  challenges: [],
  skillScores: {
    recall: 25,
    'loose-lead-walking': 50,
    jumping: 75,
    barking: 75,
    chewing: 75,
    reactivity: 75,
    'house-training': 75,
    confidence: 75,
    'impulse-control': 75,
    focus: 50,
  },
  unknownSkills: [],
  assessmentId: 'assessment-1',
  notes: '',
  createdAt,
  updatedAt: createdAt,
};

describe('DailyPlanRecommendationService', () => {
  const catalogue = LessonCatalogue.load([recall, focus, lead, secondRecall, inactive]);
  const service = new DailyPlanRecommendationService(catalogue, () => new Date('2026-07-22T00:00:00.000Z'));

  it('prioritises weak skills and in-progress lessons deterministically', () => {
    const result = service.recommend({
      dogAgeMonths: 24,
      behaviourProfile: profile,
      progressRecords: [
        lessonProgress({ lessonId: recall.id, status: 'inProgress', attempts: 3, successfulCompletions: 0 }),
        lessonProgress({ id: 'p-focus', lessonId: focus.id }),
        lessonProgress({ id: 'p-lead', lessonId: lead.id }),
        lessonProgress({ id: 'p-recall-two', lessonId: secondRecall.id }),
      ],
      targetMinutes: 20,
      maximumLessons: 2,
    });

    expect(result.recommendations.map((item) => item.lessonId)).toEqual([recall.id, focus.id]);
    expect(result.recommendations[0].reasons).toContain('IN_PROGRESS');
    expect(result.recommendations[0].reasons).toContain('NEEDS_PRACTICE');
    expect(result.totalEstimatedMinutes).toBe(12);
  });

  it('selects no more than one lesson per skill', () => {
    const result = service.recommend({
      dogAgeMonths: 24,
      behaviourProfile: profile,
      progressRecords: [
        lessonProgress({ lessonId: recall.id }),
        lessonProgress({ id: 'p-recall-two', lessonId: secondRecall.id }),
        lessonProgress({ id: 'p-focus', lessonId: focus.id }),
      ],
      targetMinutes: 30,
      maximumLessons: 2,
    });

    expect(result.recommendations.filter((item) => item.skill === 'recall')).toHaveLength(1);
  });

  it('excludes inactive and age-ineligible lessons through the eligibility contract', () => {
    const puppyLesson = definition({ id: 'daily-puppy-blocked', title: 'Older Dog Lesson', skill: 'confidence', minimumDogAgeMonths: 12 });
    const localCatalogue = LessonCatalogue.load([inactive, puppyLesson]);
    const localService = new DailyPlanRecommendationService(localCatalogue);

    const result = localService.recommend({
      dogAgeMonths: 6,
      behaviourProfile: profile,
      progressRecords: [
        lessonProgress({ lessonId: inactive.id }),
        lessonProgress({ id: 'p-puppy', lessonId: puppyLesson.id }),
      ],
    });

    expect(result.recommendations).toEqual([]);
  });

  it('uses completed lessons only as reinforcement and increases priority as completion ages', () => {
    const reinforcementCatalogue = LessonCatalogue.load([focus]);
    const reinforcementService = new DailyPlanRecommendationService(reinforcementCatalogue, () => new Date('2026-07-22T00:00:00.000Z'));
    const result = reinforcementService.recommend({
      dogAgeMonths: 24,
      behaviourProfile: profile,
      progressRecords: [
        lessonProgress({
          lessonId: focus.id,
          status: 'completed',
          attempts: 3,
          successfulCompletions: 3,
          lastCompletedAt: '2026-06-01T00:00:00.000Z',
        }),
      ],
    });

    expect(result.recommendations[0]).toMatchObject({ lessonId: focus.id, kind: 'reinforcement' });
    expect(result.recommendations[0].reasons).toContain('REINFORCEMENT_DUE');
  });

  it('validates plan limits', () => {
    expect(() => service.recommend({ dogAgeMonths: 24, behaviourProfile: profile, progressRecords: [], targetMinutes: 0 as never })).toThrow(RangeError);
    expect(() => service.recommend({ dogAgeMonths: 24, behaviourProfile: profile, progressRecords: [], maximumLessons: 0 })).toThrow(RangeError);
    expect(() => service.recommend({ dogAgeMonths: 24, behaviourProfile: profile, progressRecords: [], maximumLessons: 3 })).toThrow(RangeError);
  });
});
