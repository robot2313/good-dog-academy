export type RootStackParamList = {
  Welcome: undefined;
  OwnerSetup: undefined;
  DogSetup: undefined;
  AssessmentIntro: undefined;
  AssessmentEveryday: undefined;
  AssessmentHome: undefined;
  AssessmentControl: undefined;
  AssessmentResults: undefined;
  Main: undefined;
  LessonSummary: { lessonId: string; dailyPlanId?: string };
  LessonSession: { lessonId: string; dailyPlanId?: string };
  SessionHistory: undefined;
  SessionDetail: { sessionId: string };
};

export type MainTabParamList = {
  Today: undefined;
  Academy: undefined;
  Progress: undefined;
  Dog: undefined;
};
