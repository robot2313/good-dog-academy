import type {
  Achievement,
  BehaviourProfile,
  DailyPlan,
  Dog,
  Lesson,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../../domain/models';

const createdAt = '2026-07-19T00:00:00.000Z';

export const sampleOwner: Owner = { id: 'owner-sample-001', email: 'alex.morgan@example.com', displayName: 'Alex Morgan', createdAt, updatedAt: createdAt };
export const sampleDog: Dog = { id: 'dog-sample-001', ownerId: sampleOwner.id, name: 'Milo', breed: 'Labrador Retriever mix', dateOfBirth: '2024-03-12', sex: 'male', weightKg: 24.5, createdAt, updatedAt: createdAt };
export const sampleBehaviourProfile: BehaviourProfile = { id: 'behaviour-profile-sample-001', dogId: sampleDog.id, energyLevel: 'high', confidenceLevel: 'medium', foodMotivation: 'high', challenges: ['recall', 'lead-pulling'], notes: 'Engages well indoors and needs support around outdoor distractions.', createdAt, updatedAt: createdAt };

export const sampleLessons: Lesson[] = [
  { id: 'lesson-marker-word-001', slug: 'build-a-marker-word', title: 'Build a Marker Word', description: 'Teach a clear marker that identifies the exact behaviour earning a reward.', category: 'foundation', difficulty: 1, estimatedMinutes: 8, steps: ['Choose a short marker word.', 'Say the marker and deliver a reward.', 'Repeat in a quiet room.'], successCriteria: ['The dog anticipates a reward after hearing the marker.'], published: true, createdAt, updatedAt: createdAt },
  { id: 'lesson-indoor-recall-001', slug: 'indoor-recall', title: 'Indoor Recall', description: 'Build a fast and enthusiastic recall over a short indoor distance.', category: 'recall', difficulty: 1, estimatedMinutes: 10, steps: ['Begin a few steps away.', 'Say the dog’s name and recall cue once.', 'Mark and reward movement toward you.'], successCriteria: ['The dog returns promptly on four of five repetitions.'], published: true, createdAt, updatedAt: createdAt },
];

export const sampleDailyPlan: DailyPlan = { id: 'daily-plan-sample-001', dogId: sampleDog.id, date: '2026-07-19', lessonIds: sampleLessons.map((lesson) => lesson.id), status: 'in-progress', createdAt, updatedAt: createdAt };
export const sampleTrainingSession: TrainingSession = { id: 'training-session-sample-001', dogId: sampleDog.id, lessonId: sampleLessons[0].id, dailyPlanId: sampleDailyPlan.id, startedAt: '2026-07-19T00:15:00.000Z', completedAt: '2026-07-19T00:23:00.000Z', durationMinutes: 8, outcome: 'success', notes: 'Milo responded consistently in the quiet living room.' };
export const sampleAchievement: Achievement = { id: 'achievement-sample-001', dogId: sampleDog.id, code: 'FIRST_SESSION', title: 'First Step', description: 'Completed the first Good Dog Academy training session.', earnedAt: '2026-07-19T00:23:00.000Z' };
export const sampleProgress: Progress = { id: 'progress-sample-001', dogId: sampleDog.id, completedLessonIds: [sampleLessons[0].id], sessionsCompleted: 1, currentStreakDays: 1, bestStreakDays: 1, totalTrainingMinutes: 8, updatedAt: '2026-07-19T00:23:00.000Z' };
export const sampleNotificationSettings: NotificationSettings = { id: 'notification-settings-sample-001', ownerId: sampleOwner.id, enabled: true, dailyReminderEnabled: true, dailyReminderTime: '18:30', timezone: 'Australia/Adelaide', weeklySummaryEnabled: true, updatedAt: createdAt };
