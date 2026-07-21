import type { BehaviourProfile } from '../../src/domain/models';
import { DailyPlanGenerator, dogAgeInMonths } from '../../src/features/dailyPlan/DailyPlanGenerator';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';

const profile: BehaviourProfile = {
  id: 'profile-1', dogId: 'dog-1', energyLevel: 'medium', foodMotivation: 'medium', challenges: [],
  skillScores: { recall: 25, 'loose-lead-walking': 75, jumping: 75, barking: 75, chewing: 75, reactivity: 75, 'house-training': 75, confidence: 75, 'impulse-control': 75, focus: 75 },
  unknownSkills: [], assessmentId: 'assessment-1', notes: '', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('DailyPlanGenerator', () => {
  it('prioritises eligible new learning and the weakest assessed skill', () => {
    const secondFoundation = { ...foundationLesson, id: 'focus-foundation', skill: 'focus' as const };
    const generator = new DailyPlanGenerator(LessonCatalogue.load([foundationLesson, secondFoundation]));
    expect(generator.generate(profile, 12, [], 1)).toEqual([foundationLesson.id]);
  });

  it('excludes locked lessons and uses completed work only as reinforcement', () => {
    const catalogue = LessonCatalogue.load([foundationLesson, recallLesson]);
    const completed = lessonProgress({ status: 'completed', attempts: 1, successfulCompletions: 1, lastCompletedAt: '2026-07-20T00:00:00.000Z' });
    expect(new DailyPlanGenerator(catalogue).generate(profile, 12, [completed], 2)).toEqual([recallLesson.id, foundationLesson.id]);
  });

  it('calculates exact and estimated ages deterministically', () => {
    const now = new Date('2026-07-22T00:00:00.000Z');
    expect(dogAgeInMonths('2025-01-23', null, now)).toBe(17);
    expect(dogAgeInMonths(null, 2.5, now)).toBe(30);
  });
});
