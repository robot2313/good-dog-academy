import 'camera_coach_models.dart';

enum CameraCoachQaKind { posture, fourPaws, noDog, trackingLoss }

class CameraCoachQaLesson {
  const CameraCoachQaLesson({
    required this.id,
    required this.title,
    required this.description,
    required this.targetReps,
    required this.expectedPosture,
    required this.responseWindowMs,
    required this.kind,
  });

  final String id;
  final String title;
  final String description;
  final int? targetReps;
  final DogPosture? expectedPosture;
  final int? responseWindowMs;
  final CameraCoachQaKind kind;
}

const cameraCoachQaLessons = <CameraCoachQaLesson>[
  CameraCoachQaLesson(
    id: 'qa-camera-sit',
    title: 'QA — Camera Coach Sit',
    description: 'Controlled automatic Sit recognition.',
    targetReps: 5,
    expectedPosture: DogPosture.sitLike,
    responseWindowMs: 5000,
    kind: CameraCoachQaKind.posture,
  ),
  CameraCoachQaLesson(
    id: 'qa-camera-stand',
    title: 'QA — Camera Coach Stand',
    description: 'Controlled automatic Stand recognition.',
    targetReps: 5,
    expectedPosture: DogPosture.standLike,
    responseWindowMs: 5000,
    kind: CameraCoachQaKind.posture,
  ),
  CameraCoachQaLesson(
    id: 'qa-camera-down',
    title: 'QA — Camera Coach Down',
    description: 'Controlled automatic Down recognition.',
    targetReps: 5,
    expectedPosture: DogPosture.downLike,
    responseWindowMs: 5000,
    kind: CameraCoachQaKind.posture,
  ),
  CameraCoachQaLesson(
    id: 'qa-camera-four-paws',
    title: 'QA — Camera Coach Four Paws',
    description:
        'Controlled Four Paws scenario; posture-only automatic scoring is intentionally disabled.',
    targetReps: 5,
    expectedPosture: null,
    responseWindowMs: null,
    kind: CameraCoachQaKind.fourPaws,
  ),
  CameraCoachQaLesson(
    id: 'qa-camera-no-dog',
    title: 'QA — Camera Coach No Dog',
    description:
        'Safety scenario verifying that no dog means no scored rep or reward.',
    targetReps: null,
    expectedPosture: null,
    responseWindowMs: null,
    kind: CameraCoachQaKind.noDog,
  ),
  CameraCoachQaLesson(
    id: 'qa-camera-tracking-loss',
    title: 'QA — Camera Coach Tracking Loss',
    description:
        'Recovery scenario verifying temporary loss and reacquisition.',
    targetReps: null,
    expectedPosture: null,
    responseWindowMs: null,
    kind: CameraCoachQaKind.trackingLoss,
  ),
];

bool isCameraCoachQaLessonId(String lessonId) =>
    cameraCoachQaLessons.any((lesson) => lesson.id == lessonId);

CameraCoachQaLesson? getCameraCoachQaLesson(String lessonId) {
  for (final lesson in cameraCoachQaLessons) {
    if (lesson.id == lessonId) return lesson;
  }
  return null;
}
