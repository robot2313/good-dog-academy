import 'camera_coach_models.dart';

class ExpectedCueResponse {
  const ExpectedCueResponse({
    required this.cueId,
    required this.cueLabel,
    required this.expectedPosture,
    required this.responseWindowMs,
  });

  final String cueId;
  final String cueLabel;
  final DogPosture expectedPosture;
  final int responseWindowMs;
}

/// Automatic posture scoring is deliberately opt-in per lesson/cue.
///
/// Never infer a posture success criterion from lesson titles, tags, or free
/// text. A lesson belongs here only when one posture is itself the authoritative
/// success criterion for the observed rep.
const _expectedCueResponses = <String, ExpectedCueResponse>{
  'qa-camera-sit': ExpectedCueResponse(
    cueId: 'qa-camera-sit',
    cueLabel: 'Sit',
    expectedPosture: DogPosture.sitLike,
    responseWindowMs: 5000,
  ),
  'qa-camera-stand': ExpectedCueResponse(
    cueId: 'qa-camera-stand',
    cueLabel: 'Stand',
    expectedPosture: DogPosture.standLike,
    responseWindowMs: 5000,
  ),
  'qa-camera-down': ExpectedCueResponse(
    cueId: 'qa-camera-down',
    cueLabel: 'Down',
    expectedPosture: DogPosture.downLike,
    responseWindowMs: 5000,
  ),
};

ExpectedCueResponse? expectedCueResponseForLesson(String lessonId) =>
    _expectedCueResponses[lessonId];

bool supportsAutomaticPostureScoring(String lessonId) =>
    expectedCueResponseForLesson(lessonId) != null;
