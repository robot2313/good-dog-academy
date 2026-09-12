import type { BehaviourSkill } from '../domain/models';
import type { LessonCollectionId } from '../features/lessons/discovery';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Welcome: undefined;
  OwnerSetup: undefined;
  DogSetup: undefined;
  AssessmentIntro: undefined;
  AssessmentEveryday: undefined;
  AssessmentHome: undefined;
  AssessmentControl: undefined;
  AssessmentResults: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Journey: undefined;
  Profile: undefined;
  DogStages: undefined;
  Recommended: undefined;
  LessonBrowse: { skill?: BehaviourSkill; collectionId?: LessonCollectionId; recommended?: boolean } | undefined;
  Troubleshooter: { mode?: 'standard' | 'help-now' } | undefined;
  Privacy: undefined;
  LessonSummary: { lessonId: string; dailyPlanId?: string; selfDirected?: boolean };
  LessonSession: { lessonId: string; dailyPlanId?: string; selfDirected?: boolean };
  CameraCoach: { lessonId: string; dailyPlanId?: string };
  SessionHistory: undefined;
  SessionDetail: { sessionId: string };
  TrainingIntelligence: undefined;
};

export type MainTabParamList = {
  Today: { celebrateLessonId?: string; celebrateLessonTitle?: string } | undefined;
  Plan: undefined;
  Academy: undefined;
  Progress: undefined;
  Dog: undefined;
};
