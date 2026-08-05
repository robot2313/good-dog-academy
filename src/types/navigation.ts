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
  Troubleshooter: { mode?: 'standard' | 'help-now' } | undefined;
  Privacy: undefined;
  Account: undefined;
  LessonSummary: { lessonId: string; dailyPlanId?: string };
  LessonSession: { lessonId: string; dailyPlanId?: string };
  SessionHistory: undefined;
  SessionDetail: { sessionId: string };
};

export type MainTabParamList = {
  Today: { celebrateLessonId?: string; celebrateLessonTitle?: string } | undefined;
  Academy: undefined;
  Progress: undefined;
  Dog: undefined;
};
