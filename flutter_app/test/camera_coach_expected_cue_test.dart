import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/expected_cue_response.dart';

void main() {
  test('QA posture lessons are the only configured automatic posture cues', () {
    expect(
      expectedCueResponseForLesson('qa-camera-sit')?.expectedPosture,
      DogPosture.sitLike,
    );
    expect(
      expectedCueResponseForLesson('qa-camera-stand')?.expectedPosture,
      DogPosture.standLike,
    );
    expect(
      expectedCueResponseForLesson('qa-camera-down')?.expectedPosture,
      DogPosture.downLike,
    );
  });

  test('four-paws-down is not reduced to a posture guess', () {
    expect(expectedCueResponseForLesson('jumping-four-paws-down'), isNull);
    expect(
      supportsAutomaticPostureScoring('jumping-four-paws-down'),
      isFalse,
    );
  });

  test('multi-position settle lesson remains owner-confirmed', () {
    expect(
      expectedCueResponseForLesson('impulse-control-settle-on-mat'),
      isNull,
    );
  });

  test('attention and recall outcomes remain owner-confirmed', () {
    expect(expectedCueResponseForLesson('focus-check-in'), isNull);
    expect(expectedCueResponseForLesson('recall-name-response'), isNull);
  });

  test('unknown lessons fail closed', () {
    expect(expectedCueResponseForLesson('future-unconfigured-lesson'), isNull);
    expect(
      supportsAutomaticPostureScoring('future-unconfigured-lesson'),
      isFalse,
    );
  });
}
