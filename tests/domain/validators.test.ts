import {
  sampleAchievement,
  sampleBehaviourProfile,
  sampleDailyPlan,
  sampleDog,
  sampleLessons,
  sampleNotificationSettings,
  sampleOwner,
  sampleProgress,
  sampleTrainingSession,
} from '../../src/development/seed/sampleData';
import {
  validateAchievement,
  validateBehaviourProfile,
  validateDailyPlan,
  validateDog,
  validateLesson,
  validateNotificationSettings,
  validateOwner,
  validateProgress,
  validateTrainingSession,
} from '../../src/domain/validation';

type Case = {
  name: string;
  valid: Record<string, unknown>;
  validate: (value: unknown) => { valid: boolean; errors: string[] };
  requiredField: string;
  invalid: Record<string, unknown>;
  boundary: Record<string, unknown>;
};

const cases: Case[] = [
  { name: 'Owner', valid: sampleOwner, validate: validateOwner, requiredField: 'displayName', invalid: { ...sampleOwner, email: 'invalid' }, boundary: { ...sampleOwner, displayName: 'A' } },
  { name: 'Dog', valid: sampleDog, validate: validateDog, requiredField: 'ownerId', invalid: { ...sampleDog, sex: 'other' }, boundary: { ...sampleDog, weightKg: null, dateOfBirth: null } },
  { name: 'BehaviourProfile', valid: sampleBehaviourProfile, validate: validateBehaviourProfile, requiredField: 'dogId', invalid: { ...sampleBehaviourProfile, energyLevel: 'extreme' }, boundary: { ...sampleBehaviourProfile, challenges: [], notes: '' } },
  { name: 'Lesson', valid: sampleLessons[0], validate: validateLesson, requiredField: 'title', invalid: { ...sampleLessons[0], difficulty: 6 }, boundary: { ...sampleLessons[0], difficulty: 5, estimatedMinutes: 1 } },
  { name: 'DailyPlan', valid: sampleDailyPlan, validate: validateDailyPlan, requiredField: 'dogId', invalid: { ...sampleDailyPlan, status: 'unknown' }, boundary: { ...sampleDailyPlan, lessonIds: [] } },
  { name: 'TrainingSession', valid: sampleTrainingSession, validate: validateTrainingSession, requiredField: 'lessonId', invalid: { ...sampleTrainingSession, outcome: 'mixed' }, boundary: { ...sampleTrainingSession, dailyPlanId: null, completedAt: null, outcome: null, durationMinutes: 0 } },
  { name: 'Achievement', valid: sampleAchievement, validate: validateAchievement, requiredField: 'code', invalid: { ...sampleAchievement, earnedAt: 'not-a-date' }, boundary: { ...sampleAchievement, title: 'A', description: 'A' } },
  { name: 'Progress', valid: sampleProgress, validate: validateProgress, requiredField: 'dogId', invalid: { ...sampleProgress, sessionsCompleted: -1 }, boundary: { ...sampleProgress, completedLessonIds: [], sessionsCompleted: 0, currentStreakDays: 0, bestStreakDays: 0, totalTrainingMinutes: 0 } },
  { name: 'NotificationSettings', valid: sampleNotificationSettings, validate: validateNotificationSettings, requiredField: 'ownerId', invalid: { ...sampleNotificationSettings, dailyReminderTime: '25:00' }, boundary: { ...sampleNotificationSettings, dailyReminderTime: '00:00' } },
];

describe.each(cases)('$name validator', ({ valid, validate, requiredField, invalid, boundary }) => {
  it('accepts a valid record', () => expect(validate(valid)).toMatchObject({ valid: true, errors: [] }));

  it('rejects a missing required field', () => {
    const candidate = { ...valid };
    delete candidate[requiredField];
    expect(validate(candidate).valid).toBe(false);
  });

  it('rejects an invalid value', () => expect(validate(invalid).valid).toBe(false));
  it('accepts valid boundary values', () => expect(validate(boundary).valid).toBe(true));
  it('rejects null', () => expect(validate(null).valid).toBe(false));
  it('rejects undefined', () => expect(validate(undefined).valid).toBe(false));
});

describe('additional validator boundaries', () => {
  it('accepts both Lesson difficulty boundaries', () => {
    expect(validateLesson({ ...sampleLessons[0], difficulty: 1 }).valid).toBe(true);
    expect(validateLesson({ ...sampleLessons[0], difficulty: 5 }).valid).toBe(true);
  });

  it('rejects zero dog weight and malformed dates', () => {
    expect(validateDog({ ...sampleDog, weightKg: 0 }).valid).toBe(false);
    expect(validateDailyPlan({ ...sampleDailyPlan, date: '19/07/2026' }).valid).toBe(false);
  });

  it('rejects invalid challenge and non-integer progress values', () => {
    expect(validateBehaviourProfile({ ...sampleBehaviourProfile, challenges: ['barking'] }).valid).toBe(false);
    expect(validateProgress({ ...sampleProgress, totalTrainingMinutes: 1.5 }).valid).toBe(false);
  });
});
