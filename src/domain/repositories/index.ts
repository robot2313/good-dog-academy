import type {
  Achievement,
  BehaviourProfile,
  BehaviourAssessment,
  DailyPlan,
  Dog,
  Lesson,
  NotificationSettings,
  Owner,
  Progress,
  TrainingSession,
} from '../models';
import type { Repository } from './Repository';

export interface OwnerRepository extends Repository<Owner> {}
export interface DogRepository extends Repository<Dog> {}
export interface BehaviourProfileRepository extends Repository<BehaviourProfile> {}
export interface BehaviourAssessmentRepository extends Repository<BehaviourAssessment> {}
export interface LessonRepository extends Repository<Lesson> {}
export interface DailyPlanRepository extends Repository<DailyPlan> {}
export interface TrainingSessionRepository extends Repository<TrainingSession> {}
export interface AchievementRepository extends Repository<Achievement> {}
export interface ProgressRepository extends Repository<Progress> {}
export interface NotificationSettingsRepository extends Repository<NotificationSettings> {}

export type DomainRepositories = {
  owners: OwnerRepository;
  dogs: DogRepository;
  behaviourProfiles: BehaviourProfileRepository;
  behaviourAssessments: BehaviourAssessmentRepository;
  lessons: LessonRepository;
  dailyPlans: DailyPlanRepository;
  trainingSessions: TrainingSessionRepository;
  achievements: AchievementRepository;
  progress: ProgressRepository;
  notificationSettings: NotificationSettingsRepository;
};

export type { Repository } from './Repository';
