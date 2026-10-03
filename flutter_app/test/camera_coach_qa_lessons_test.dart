import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_qa_lessons.dart';

void main() {
  test('QA catalogue contains controlled posture and safety scenarios', () {
    expect(cameraCoachQaLessons, hasLength(6));
    expect(getCameraCoachQaLesson('qa-camera-sit')?.expectedPosture,
        DogPosture.sitLike);
    expect(getCameraCoachQaLesson('qa-camera-no-dog')?.targetReps, isNull);
    expect(
      getCameraCoachQaLesson('qa-camera-four-paws')?.expectedPosture,
      isNull,
    );
  });

  test('unknown lesson is never treated as a QA lesson', () {
    expect(isCameraCoachQaLessonId('future-camera-test'), isFalse);
    expect(getCameraCoachQaLesson('future-camera-test'), isNull);
  });
}
