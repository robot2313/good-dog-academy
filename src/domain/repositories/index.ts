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
} from '../models';
import type { Repository } from './Repository';

export interface OwnerRepository extends Repository<Owner> {}
export interface DogRepository extends Repository<Dog> {}
export interface BehaviourProfileRepository extends Repository<BehaviourProfile> {}
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
  lessons: LessonRepository;
  dailyPlans: DailyPlanRepository;
  trainingSessions: TrainingSessionRepository;
  achievements: AchievementRepository;
  progress: ProgressRepository;
  notificationSettings: NotificationSettingsRepository;
};

export type { Repository } from './Repository';
