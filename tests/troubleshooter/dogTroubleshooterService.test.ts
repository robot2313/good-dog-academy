import type { TroubleshooterAttempt } from '../../src/domain/models';
import { troubleshooterTopicIds } from '../../src/domain/models';
import { DogTroubleshooterService } from '../../src/features/troubleshooter/DogTroubleshooterService';
import { troubleshooterConcerns } from '../../src/features/troubleshooter/troubleshooterCatalogue';
import { troubleshooterProtocols } from '../../src/features/troubleshooter/troubleshooterProtocols';
import type { TroubleshooterDiagnosticAnswers } from '../../src/features/troubleshooter/troubleshooterTypes';
import type { LessonLibraryItem, LessonState } from '../../src/features/lessons/library/lessonLibraryTypes';

describe('DogTroubleshooterService', () => {
  it('offers one unique concern and one complete protocol for every supported topic', () => {
    expect(troubleshooterConcerns.map((concern) => concern.id).sort()).toEqual([...troubleshooterTopicIds].sort());
    expect(new Set(troubleshooterConcerns.map((concern) => concern.id)).size).toBe(troubleshooterTopicIds.length);
    expect(troubleshooterProtocols.map((protocol) => protocol.topicId).sort()).toEqual([...troubleshooterTopicIds].sort());

    for (const protocol of troubleshooterProtocols) {
      expect(protocol.explanation.length).toBeGreaterThanOrEqual(2);
      expect(protocol.why.length).toBeGreaterThanOrEqual(2);
      expect(protocol.exercise.steps.length).toBeGreaterThanOrEqual(4);
      expect(protocol.difficultySigns.length).toBeGreaterThanOrEqual(3);
      expect(protocol.successCriteria.length).toBeGreaterThanOrEqual(3);
      expect(protocol.stopConditions.length).toBeGreaterThanOrEqual(3);
      expect(protocol.fallbackLevel2.length).toBeGreaterThanOrEqual(3);
      expect(protocol.fallbackLevel3.length).toBeGreaterThanOrEqual(3);
      expect(protocol.reviewStatus).toBe('professional-review-required');
    }
  });

  it('returns a complete practical result and keeps related lessons optional', () => {
    const service = createService([
      lesson('recall-short-distance', 'recall', 'AVAILABLE', 2),
      lesson('recall-around-distractions', 'recall', 'LOCKED', 3),
      lesson('focus-check-in', 'focus', 'IN_PROGRESS', 1),
    ]);

    const result = service.recommend(answers('recall', 'recall-inside-not-outside'));

    expect(result.failureCategory).toBe('not_generalised');
    expect(result.primaryAdjustment).toMatch(/easiest successful version/i);
    expect(result.exercise.minutes).toMatch(/minutes/);
    expect(result.exercise.steps).toHaveLength(4);
    expect(result.protocol.successCriteria).not.toHaveLength(0);
    expect(result.protocol.stopConditions).not.toHaveLength(0);
    expect(result.protocol.fallbackLevel2).not.toHaveLength(0);
    expect(result.protocol.fallbackLevel3).not.toHaveLength(0);
    expect(result.selectionExplanation).toMatch(/works in an easy room/i);
    expect(result.primaryLesson?.lesson.id).toBe('recall-short-distance');
    expect(result.alternativeLessons.map((item) => item.lesson.id)).toEqual(['recall-around-distractions']);
  });

  it('can resolve all eight failure categories for every core training skill', () => {
    const service = createService([]);
    const coreTopics = [
      ['recall', 'recall-inside-not-outside'],
      ['sit', 'sit-visible-food'],
      ['stay', 'stay-breaks-immediately'],
      ['loose-lead-walking', 'lead-pulls-from-start'],
      ['settling', 'settle-more-excited'],
    ] as const;
    const categoryAnswers = [
      { responseState: 'distraction-too-strong' },
      { responseState: 'difficulty-was-increased' },
      { responseState: 'usual-reward-not-working' },
      { responseState: 'cue-seems-unclear' },
      { responseState: 'works-only-in-familiar-place' },
      { responseState: 'timing-or-visible-help' },
      { responseState: 'disengages-quickly' },
      { bodyState: 'excited-or-frustrated' },
    ] as const;

    for (const [topicId, scenarioId] of coreTopics) {
      const resolved = categoryAnswers.map((overrides) => service.recommend({ ...answers(topicId, scenarioId), ...overrides }).failureCategory);
      expect(new Set(resolved)).toEqual(new Set([
        'high_distraction',
        'difficulty_increased_too_quickly',
        'reward_not_effective',
        'cue_not_understood',
        'not_generalised',
        'handler_timing_or_cue_issue',
        'session_too_long_or_dog_disengaged',
        'overexcited_frustrated_or_fearful',
      ]));
    }
  });

  it.each([
    ['recall', 'recall-inside-not-outside', /doorway|yard/i, /shorten|easiest/i],
    ['stay', 'stay-breaks-immediately', /one.second/i, /last easy|difficulty/i],
    ['loose-lead-walking', 'lead-pulls-at-dogs', /check-in/i, /distance/i],
    ['settling', 'settle-more-excited', /one calm moment/i, /reduce pressure/i],
    ['sit', 'sit-visible-food', /empty hand/i, /food hidden/i],
  ] as const)('provides the required practical exemplar for %s', (topicId, scenarioId, exercisePattern, adjustmentPattern) => {
    const result = createService([]).recommend(answers(topicId, scenarioId));
    expect([result.exercise.title, ...result.exercise.setup, ...result.exercise.steps].join(' ')).toMatch(exercisePattern);
    expect(result.primaryAdjustment).toMatch(adjustmentPattern);
  });

  it('moves no-change outcomes through fallback levels without returning to level one', () => {
    const service = createService([]);
    const diagnostic = answers('stay', 'stay-breaks-immediately');
    const level2 = service.recommend(diagnostic, [attempt({ topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 1, outcome: 'no-change' })]);
    expect(level2.fallbackLevel).toBe(2);
    expect(level2.exercise.title).toMatch(/level 2/i);

    const level3 = service.recommend(diagnostic, [
      attempt({ topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 1, outcome: 'no-change', createdAt: '2026-08-01T00:00:00.000Z' }),
      attempt({ topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 2, outcome: 'no-change', createdAt: '2026-08-02T00:00:00.000Z' }),
    ]);
    expect(level3.fallbackLevel).toBe(3);

    const stillLevel3 = service.recommend(diagnostic, [...level3History()]);
    expect(stillLevel3.fallbackLevel).toBe(3);
    expect(stillLevel3.progressMessage).toMatch(/final fallback/i);
  });

  it.each([
    ['worse', /lowers the difficulty/i],
    ['slightly-better', /repeat this same level/i],
    ['successful-once', /not mastery/i],
    ['successful-three-times', /one small increase/i],
    ['reliable', /this yard only/i],
  ] as const)('adapts after a %s outcome', (outcome, message) => {
    const result = createService([]).recommend(
      answers('recall', 'recall-inside-not-outside'),
      [attempt({ outcome, environment: 'this yard' })],
    );
    expect(result.progressMessage).toMatch(message);
  });

  it.each([
    ['panic-snapping-or-aggression', /Training stops here/i],
    ['possible-pain-or-sudden-change', /Check health before training/i],
    ['injury-child-or-control-risk', /make the situation safe/i],
  ] as const)('overrides training for %s', (bodyState, title) => {
    const result = createService([]).recommend({ ...answers('reactivity', 'react-dogs'), bodyState });
    expect(result.safetyOverride?.title).toMatch(title);
  });

  it('rejects a scenario that does not belong to the selected topic', () => {
    expect(() => createService([]).recommend(answers('recall', 'stay-breaks-immediately'))).toThrow(/Unknown scenario/);
  });
});

function createService(lessons: readonly LessonLibraryItem[]): DogTroubleshooterService {
  return new DogTroubleshooterService({ getAllLessons: () => lessons });
}

function answers(
  topicId: TroubleshooterDiagnosticAnswers['topicId'] = 'recall',
  scenarioId = 'recall-inside-not-outside',
): TroubleshooterDiagnosticAnswers {
  return { topicId, scenarioId, bodyState: 'relaxed-and-engaged', responseState: 'can-eat-and-respond', environment: 'this yard' };
}

function attempt(overrides: Partial<TroubleshooterAttempt> = {}): TroubleshooterAttempt {
  return {
    id: 'attempt-1', ownerId: 'owner-1', dogId: 'dog-1', topicId: 'recall', scenarioId: 'recall-inside-not-outside',
    failureCategory: 'not_generalised', protocolId: 'recall-reset', protocolVersion: 1, fallbackLevel: 1,
    outcome: 'no-change', environment: 'this yard', createdAt: '2026-08-03T00:00:00.000Z', ...overrides,
  };
}

function level3History(): readonly TroubleshooterAttempt[] {
  return [
    attempt({ topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 1, createdAt: '2026-08-01T00:00:00.000Z' }),
    attempt({ id: 'attempt-2', topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 2, createdAt: '2026-08-02T00:00:00.000Z' }),
    attempt({ id: 'attempt-3', topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 3, createdAt: '2026-08-03T00:00:00.000Z' }),
  ];
}

function lesson(id: string, skill: LessonLibraryItem['skill'], state: LessonState, difficulty: LessonLibraryItem['difficulty']): LessonLibraryItem {
  const metadata = { id, title: id, description: `${id} description`, difficulty, estimatedMinutes: 5, skill, keywords: [skill] };
  return state === 'LOCKED'
    ? { ...metadata, state, lock: { reason: 'Complete the foundation first.', missingPrerequisiteIds: [], missingPrerequisiteNames: [] } }
    : { ...metadata, state, lock: null };
}
