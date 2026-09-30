import type {
  BehaviourProfile,
  BehaviourSkill,
  LessonDefinition,
} from '../../../src/domain/models';
import type {
  AdaptiveTrainingMemory,
  SessionHistoryRecord,
} from '../../../src/domain/models/AdaptiveTrainingMemory';
import { LessonCatalogue } from '../../../src/features/lessons/catalogue';
import { DailyPlanRecommendationService } from '../../../src/features/daily-plan/DailyPlanRecommendationService';

const skills: BehaviourSkill[] = [
  'recall',
  'loose-lead-walking',
  'jumping',
  'barking',
  'chewing',
  'reactivity',
  'house-training',
  'confidence',
  'impulse-control',
  'focus',
];

const scores = Object.fromEntries(
  skills.map((skill) => [skill, skill === 'recall' ? 20 : 90]),
) as Record<BehaviourSkill, number>;

const profile: BehaviourProfile = {
  id: 'profile-1',
  dogId: 'dog-1',
  energyLevel: 'medium',
  foodMotivation: 'high',
  challenges: ['recall'],
  skillScores: scores,
  unknownSkills: [],
  assessmentId: 'assessment-1',
  notes: '',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

function lesson(
  id: string,
  difficultyLevel: 1 | 2 | 3 | 4 | 5,
): LessonDefinition {
  return {
    id,
    contentVersion: 1,
    title: id,
    shortDescription: id,
    skill: 'recall',
    category: 'foundation',
    difficultyLevel,
    estimatedMinutes: 5,
    goal: 'Practice recall',
    equipment: [],
    prerequisites: [],
    minimumDogAgeMonths: null,
    steps: ['Call dog'],
    tips: [],
    commonMistakes: [],
    troubleshooting: [],
    safetyNotes: [],
    completionCriteria: {
      description: 'Complete the exercise',
      minimumSuccessfulCompletions: 1,
      minimumPerformanceRating: null,
    },
    tags: ['recall'],
    isActive: true,
  };
}

const catalogue = LessonCatalogue.load([
  lesson('recall-easy', 1),
  lesson('recall-hard', 3),
]);

function memory(overrides: Partial<AdaptiveTrainingMemory['skills'][string]> = {}): AdaptiveTrainingMemory {
  return {
    schemaVersion: 1,
    dogId: 'dog-1',
    totalSessions: 2,
    updatedAt: '2026-09-20T00:00:00.000Z',
    skills: {
      recall: {
        skillId: 'recall',
        sessionsCompleted: 2,
        totalReps: 10,
        cleanRepRate: 0.9,
        repeatedCueRate: 0.1,
        slowResponseRate: 0.1,
        stressSignalRate: 0,
        correctedRepRate: 0,
        lastTrainedAt: '2026-09-20T00:00:00.000Z',
        lastEndedEarly: false,
        lastEndReason: 'target_reached',
        recommendedDifficulty: {
          distance: 3,
          duration: 3,
          distraction: 3,
        },
        ...overrides,
      },
    },
  };
}

function history(
  overrides: Partial<SessionHistoryRecord> = {},
): SessionHistoryRecord[] {
  const base: SessionHistoryRecord = {
    id: 'session-1',
    dogId: 'dog-1',
    lessonId: 'recall-hard',
    skillId: 'recall',
    completedAt: '2026-09-20T00:00:00.000Z',
    totalReps: 5,
    cleanRepRate: 0.9,
    repeatedCueRate: 0.1,
    slowResponseRate: 0.1,
    stressSignalRate: 0,
    correctedRepRate: 0,
    endedEarly: false,
    endReason: 'target_reached',
    startingDifficulty: {
      distance: 3,
      duration: 3,
      distraction: 3,
    },
    endingDifficulty: {
      distance: 3,
      duration: 3,
      distraction: 3,
    },
    ...overrides,
  };

  return [
    base,
    {
      ...base,
      id: 'session-2',
      completedAt: '2026-09-19T00:00:00.000Z',
    },
  ];
}

function recommend(
  adaptiveMemory?: AdaptiveTrainingMemory,
  adaptiveHistory?: SessionHistoryRecord[],
) {
  const service = new DailyPlanRecommendationService(
    catalogue,
    () => new Date('2026-09-21T00:00:00.000Z'),
  );

  return service.recommend({
    dogAgeMonths: 36,
    behaviourProfile: profile,
    progressRecords: [
      {
        id: 'progress-hard',
        ownerId: 'owner-1',
        dogId: 'dog-1',
        lessonId: 'recall-hard',
        status: 'inProgress',
        attempts: 3,
        successfulCompletions: 1,
        lastAttemptedAt: '2026-09-20T00:00:00.000Z',
        lastCompletedAt: null,
        bestPerformanceRating: null,
        currentDifficultyAdjustment: 0,
        unlockedAt: '2026-09-01T00:00:00.000Z',
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
      },
    ],
    targetMinutes: 15,
    maximumLessons: 1,
    adaptiveMemory,
    adaptiveHistory,
  });
}

describe('DailyPlanRecommendationService adaptive Brain wiring', () => {
  test('keeps normal recommendation when there is no adaptive evidence', () => {
    expect(recommend().recommendations[0]?.lessonId).toBe('recall-hard');
  });

  test('keeps normal recommendation with only one recent session', () => {
    expect(
      recommend(memory(), history().slice(0, 1)).recommendations[0]?.lessonId,
    ).toBe('recall-hard');
  });

  test('steps down when recent stress evidence exists', () => {
    expect(
      recommend(
        memory({ stressSignalRate: 0.3 }),
        history({ stressSignalRate: 0.3 }),
      ).recommendations[0]?.lessonId,
    ).toBe('recall-easy');
  });

  test('steps down when recent clean-rep performance is below 55%', () => {
    expect(
      recommend(
        memory({ cleanRepRate: 0.4 }),
        history({ cleanRepRate: 0.4 }),
      ).recommendations[0]?.lessonId,
    ).toBe('recall-easy');
  });

  test('steps down when repeated-cue rate reaches 40%', () => {
    expect(
      recommend(
        memory({ repeatedCueRate: 0.4 }),
        history(),
      ).recommendations[0]?.lessonId,
    ).toBe('recall-easy');
  });

  test('steps down when slow-response rate reaches 40%', () => {
    expect(
      recommend(
        memory({ slowResponseRate: 0.4 }),
        history(),
      ).recommendations[0]?.lessonId,
    ).toBe('recall-easy');
  });

  test('keeps normal recommendation when adaptive evidence is healthy', () => {
    expect(
      recommend(memory(), history()).recommendations[0]?.lessonId,
    ).toBe('recall-hard');
  });
});
