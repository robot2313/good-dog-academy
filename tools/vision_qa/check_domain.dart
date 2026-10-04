// Offline checks for the actual dependency-free benchmark domain implementation.
// Run with: dart tools/vision_qa/check_domain.dart
import '../../flutter_app/lib/features/camera_coach/domain/vision_benchmark.dart';

void check(bool condition, String description) {
  if (!condition) throw StateError(description);
}

void main() {
  final report = summarizeBenchmarkLabels([
    {'truth': 'sitLike', 'dogDetected': true, 'posture': 'sitLike'},
    {'truth': 'sitLike', 'dogDetected': true, 'posture': null},
    {'truth': 'standLike', 'dogDetected': false, 'posture': null},
    {'truth': 'noDog', 'dogDetected': true, 'posture': 'sitLike'},
    {'truth': 'noDog', 'dogDetected': false, 'posture': null},
    {'truth': 'unsure', 'dogDetected': true, 'posture': 'downLike'},
  ]);
  check(report['samples'] == 5, 'Exclude unsure');
  check(report['coverage'] == 1 / 3, 'Coverage includes UNKNOWN/missed dogs');
  check((report['dog'] as Map)['recall'] == 2 / 3, 'Detection recall');
  check(
    (report['dog'] as Map)['falsePositiveRate'] == .5,
    'No-dog false positives',
  );
  final sit = (report['postures'] as Map)['sitLike'] as Map;
  check(
    sit['precision'] == .5 && sit['recall'] == .5,
    'Posture precision/recall',
  );
  check(
    ((report['confusion'] as Map)['sitLike'] as Map)['unknown'] == 1,
    'UNKNOWN preserved',
  );
  check(
    (summarizeBenchmarkLabels([])['dog'] as Map)['precision'] == null,
    'Empty is unavailable',
  );
  VisionBenchmarkContext context(String model, String session) =>
      VisionBenchmarkContext(
        modelId: model,
        modelVersion: 'v1',
        dogId: 'dog',
        sessionId: session,
        scenario: 'side',
        device: 'phone',
      );
  check(
    context('a', 's').partition != context('b', 's').partition,
    'Model isolation',
  );
  check(
    context('a', 's').partition != context('a', 't').partition,
    'Session isolation',
  );
  var rejected = false;
  try {
    context('', 's');
  } on ArgumentError {
    rejected = true;
  }
  check(rejected, 'Invalid metadata rejected');
  rejected = false;
  try {
    summarizeBenchmarkLabels([
      {'truth': 'invented', 'dogDetected': true, 'posture': null},
    ]);
  } on FormatException {
    rejected = true;
  }
  check(rejected, 'Invalid truth rejected');
  print(
    '11 offline benchmark domain checks passed. Flutter integration tests are separate.',
  );
}
