import type {
  Achievement,
  BehaviourAssessment,
  BehaviourProfile,
  DailyPlan,
  Dog,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../../domain/models';
import { calculateAssessmentScores, type AssessmentAnswers } from '../../features/assessment/scoring';

const createdAt = '2026-07-19T00:00:00.000Z';

export const sampleOwner: Owner = { id: 'owner-sample-001', email: 'alex.morgan@example.com', displayName: 'Alex Morgan', trainingExperience: 'intermediate', primaryGoal: 'family-companion', createdAt, updatedAt: createdAt };
export const sampleDog: Dog = { id: 'dog-sample-001', ownerId: sampleOwner.id, name: 'Milo', breed: 'Labrador Retriever mix', breedUnknown: false, dateOfBirth: '2024-03-12', birthdayEstimated: false, estimatedAgeYears: null, sex: 'male', weightKg: 24.5, weightUnit: 'kg', energyLevel: 'high', photoUri: null, createdAt, updatedAt: createdAt };
const sampleAssessmentAnswers = {
  'recall-familiar': 'sometimes', 'lead-pulling': 'often', 'focus-handler': 'often',
  'jumping-greetings': 'sometimes', 'barking-home': 'rarely', 'chewing-items': 'never',
  'house-training': 'almost-always', reactivity: 'rarely', 'confidence-new': 'often', 'impulse-control': 'sometimes',
} satisfies AssessmentAnswers;
const sampleAssessmentResult = calculateAssessmentScores(sampleAssessmentAnswers);
export const sampleBehaviourAssessment: BehaviourAssessment = { id: 'behaviour-assessment-sample-001', ownerId: sampleOwner.id, dogId: sampleDog.id, responses: sampleAssessmentResult.responses, calculatedScores: sampleAssessmentResult.calculatedScores, unknownSkills: sampleAssessmentResult.unknownSkills, completedAt: createdAt, schemaVersion: 1 };
export const sampleBehaviourProfile: BehaviourProfile = { id: 'behaviour-profile-sample-001', dogId: sampleDog.id, energyLevel: 'high', foodMotivation: 'high', challenges: ['recall', 'lead-pulling'], skillScores: sampleAssessmentResult.calculatedScores, unknownSkills: sampleAssessmentResult.unknownSkills, assessmentId: sampleBehaviourAssessment.id, notes: 'Engages well indoors and needs support around outdoor distractions.', createdAt, updatedAt: createdAt };

const legacyPresentationLessonId = 'marker';
export const sampleDailyPlan: DailyPlan = {
  id: 'daily-plan-sample-001', ownerId: sampleOwner.id, dogId: sampleDog.id, localDate: '2026-07-19',
  timezone: 'Australia/Adelaide', targetMinutes: 15, estimatedMinutes: 5, focusSkill: 'focus',
  items: [{ lessonId: legacyPresentationLessonId, skill: 'focus', role: 'primary', plannedMinutes: 5, reasonCodes: ['AVAILABLE_NEW_LEARNING'], order: 1 }],
  status: 'planned', sourceAssessmentId: sampleBehaviourAssessment.id, generatedAt: createdAt, createdAt, updatedAt: createdAt,
};
export const sampleTrainingSession: TrainingSession = { id: 'training-session-sample-001', dogId: sampleDog.id, lessonId: legacyPresentationLessonId, dailyPlanId: sampleDailyPlan.id, startedAt: '2026-07-19T00:15:00.000Z', completedAt: '2026-07-19T00:23:00.000Z', durationMinutes: 8, outcome: 'success', notes: 'Milo responded consistently in the quiet living room.' };
export const sampleAchievement: Achievement = { id: 'achievement-sample-001', dogId: sampleDog.id, code: 'FIRST_SESSION', title: 'First Step', description: 'Completed the first Good Dog Academy training session.', earnedAt: '2026-07-19T00:23:00.000Z' };
export const sampleProgress: Progress = { id: 'progress-sample-001', dogId: sampleDog.id, completedLessonIds: [legacyPresentationLessonId], sessionsCompleted: 1, currentStreakDays: 1, bestStreakDays: 1, totalTrainingMinutes: 8, updatedAt: '2026-07-19T00:23:00.000Z' };
export const sampleNotificationSettings: NotificationSettings = { id: 'notification-settings-sample-001', ownerId: sampleOwner.id, enabled: true, dailyReminderEnabled: true, dailyReminderTime: '18:30', timezone: 'Australia/Adelaide', weeklySummaryEnabled: true, updatedAt: createdAt };
