import type { DogPostureEvidence } from '../models/TrainingEvidence';

export type CameraCoachQaLessonId =
  | 'qa-camera-sit'
  | 'qa-camera-stand'
  | 'qa-camera-down'
  | 'qa-camera-four-paws'
  | 'qa-camera-no-dog'
  | 'qa-camera-tracking-loss';

export type CameraCoachQaLesson = {
  id: CameraCoachQaLessonId;
  title: string;
  description: string;
  targetReps: number | null;
  expectedPosture: Exclude<DogPostureEvidence, 'unknown'> | null;
  responseWindowMs: number | null;
  kind: 'posture' | 'four_paws' | 'no_dog' | 'tracking_loss';
};

const QA_LESSONS: readonly CameraCoachQaLesson[] = Object.freeze([
  {
    id: 'qa-camera-sit',
    title: 'QA — Camera Coach Sit',
    description: 'Controlled automatic Sit recognition.',
    targetReps: 5,
    expectedPosture: 'sit_like',
    responseWindowMs: 5000,
    kind: 'posture',
  },
  {
    id: 'qa-camera-stand',
    title: 'QA — Camera Coach Stand',
    description: 'Controlled automatic Stand recognition.',
    targetReps: 5,
    expectedPosture: 'stand_like',
    responseWindowMs: 5000,
    kind: 'posture',
  },
  {
    id: 'qa-camera-down',
    title: 'QA — Camera Coach Down',
    description: 'Controlled automatic Down recognition.',
    targetReps: 5,
    expectedPosture: 'down_like',
    responseWindowMs: 5000,
    kind: 'posture',
  },
  {
    id: 'qa-camera-four-paws',
    title: 'QA — Camera Coach Four Paws',
    description: 'Controlled Four Paws scenario; posture-only automatic scoring is intentionally disabled.',
    targetReps: 5,
    expectedPosture: null,
    responseWindowMs: null,
    kind: 'four_paws',
  },
  {
    id: 'qa-camera-no-dog',
    title: 'QA — Camera Coach No Dog',
    description: 'Safety scenario verifying that no dog means no scored rep or reward.',
    targetReps: null,
    expectedPosture: null,
    responseWindowMs: null,
    kind: 'no_dog',
  },
  {
    id: 'qa-camera-tracking-loss',
    title: 'QA — Camera Coach Tracking Loss',
    description: 'Recovery scenario verifying temporary loss and reacquisition.',
    targetReps: null,
    expectedPosture: null,
    responseWindowMs: null,
    kind: 'tracking_loss',
  },
]);

export function isCameraCoachQaLessonId(
  lessonId: string,
): lessonId is CameraCoachQaLessonId {
  return QA_LESSONS.some((lesson) => lesson.id === lessonId);
}

export function getCameraCoachQaLesson(
  lessonId: string,
): CameraCoachQaLesson | null {
  return QA_LESSONS.find((lesson) => lesson.id === lessonId) ?? null;
}

export function getCameraCoachQaLessons(): readonly CameraCoachQaLesson[] {
  return QA_LESSONS;
}
