import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/pose_shadow_validation.dart';
import 'package:good_dog_academy/features/camera_coach/pose_shadow_calibration_screen.dart';
import 'package:good_dog_academy/features/camera_coach/services/camera/camera_frame_source.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_validation_controller.dart';
import 'package:good_dog_academy/features/camera_coach/services/pose_shadow_validation_repository.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/dog_vision_engine.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/production_vision_models.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision/qa_vision_candidate.dart';
import 'package:good_dog_academy/features/camera_coach/services/vision_benchmark_repository.dart';

class Memory implements PoseShadowValidationStringStorage {
  final data = <String, String>{};
  @override
  Future<String?> read(String key) async => data[key];
  @override
  Future<void> write(String key, String value) async {
    data[key] = value;
  }
}

class Source implements CameraFrameSource {
  int starts = 0;
  CameraFrameListener? listener;
  @override
  Future<void> start() async {
    starts++;
  }

  @override
  Future<void> stop() async {}
  @override
  CameraFrameSubscription subscribe(CameraFrameListener next) {
    listener = next;
    return () => listener = null;
  }
}

class Engine implements DogVisionEngine {
  Completer<void>? gate;
  int disposals = 0;
  bool fail = false;
  bool poseFailure = false;
  @override
  Future<void> warmup() async {}
  @override
  Future<void> dispose() async {
    disposals++;
  }

  @override
  Future<DogVisionResult> detect(CameraFrame frame) async {
    await gate?.future;
    if (fail) throw StateError('bad tensor');
    return DogVisionResult(
      frameId: frame.id,
      analysedAt: frame.capturedAt,
      dogDetected: true,
      rawDogDetected: true,
      detectionConfidence: .9,
      posture: null,
      postureConfidence: null,
      stressSignal: VisionStressSignal.uncertain,
      stressConfidence: null,
      poseInferenceFailed: poseFailure,
    );
  }
}

VisionBenchmarkContext context(String model, {String session = 's1'}) =>
    VisionBenchmarkContext(
      modelId: model,
      modelVersion: 'v1',
      dogId: 'dog',
      sessionId: session,
      scenario: 'sit-side-normal',
      device: 'test-phone',
    );
CameraFrame frame(String id) => CameraFrame(
  id: id,
  capturedAt: '2026-10-04T00:00:00Z',
  width: 640,
  height: 480,
  rotationDegrees: 0,
);
PoseShadowValidationController controller(
  Memory memory,
  Engine engine, {
  String model = 'A',
  Source? source,
}) => PoseShadowValidationController(
  frameSource: source ?? Source(),
  visionEngine: engine,
  repository: PoseShadowValidationRepository(storage: memory),
  dogId: 'dog',
  lessonId: 'qa',
  expectedPosture: DogPosture.sitLike,
  benchmarkContext: context(model),
  benchmarkRepository: VisionBenchmarkRepository(memory),
);

void main() {
  test('candidate registration fails closed; production stays null', () {
    expect(productionDogVisionBundle, isNull);
    expect(visionBenchmarkEnabled, isFalse);
    for (final candidate in qaVisionCandidates) {
      expect(candidate.runnable, isFalse);
      expect(candidate.createEngine, throwsStateError);
    }
    expect(
      const QaVisionCandidate(
        id: '',
        version: '',
        name: 'invalid',
        blockers: [],
      ).runnable,
      isFalse,
    );
  });
  test('metadata and session partitions are unambiguous', () {
    expect(context('A').partition, isNot(context('B').partition));
    expect(
      context('A').partition,
      isNot(context('A', session: 's2').partition),
    );
    expect(() => context(''), throwsArgumentError);
  });
  test('UNKNOWN and no-dog false positives remain measurable', () {
    final report = summarizeBenchmarkLabels([
      {'truth': 'sitLike', 'dogDetected': true, 'posture': 'sitLike'},
      {'truth': 'sitLike', 'dogDetected': true, 'posture': null},
      {'truth': 'standLike', 'dogDetected': false, 'posture': null},
      {'truth': 'noDog', 'dogDetected': true, 'posture': 'sitLike'},
      {'truth': 'noDog', 'dogDetected': false, 'posture': null},
      {'truth': 'unsure', 'dogDetected': true, 'posture': 'downLike'},
    ]);
    expect(report['samples'], 5);
    expect(report['coverage'], 1 / 3);
    expect((report['dog'] as Map)['recall'], 2 / 3);
    expect((report['dog'] as Map)['falsePositiveRate'], .5);
    final sit = (report['postures'] as Map)['sitLike'] as Map;
    expect(sit['precision'], .5);
    expect(sit['recall'], .5);
    expect(((report['confusion'] as Map)['sitLike'] as Map)['unknown'], 1);
    expect((summarizeBenchmarkLabels([])['dog'] as Map)['precision'], isNull);
  });
  test('A and B storage never mix or touch genuine training storage', () async {
    final memory = Memory();
    for (final model in ['A', 'B']) {
      final c = controller(memory, Engine(), model: model);
      await c.start();
      await c.processFrame(frame('same-frame'));
      c.freezeForLabel();
      await c.recordGroundTruth(PoseShadowGroundTruth.sitLike);
      await c.shutdown();
      c.dispose();
    }
    final sessions = await VisionBenchmarkRepository(memory).loadSessions();
    expect(sessions, hasLength(2));
    expect(sessions.map((s) => (s['context'] as Map)['modelId']).toSet(), {
      'A',
      'B',
    });
    for (final s in sessions) {
      expect(s['labels'], hasLength(1));
      expect(((s['labels'] as List).single as Map)['posture'], isNull);
    }
    expect(
      memory.data.keys.every(
        (key) => key.startsWith(VisionBenchmarkRepository.prefix),
      ),
      isTrue,
    );
    expect(
      memory.data.containsKey(PoseShadowValidationRepository.storageKey),
      isFalse,
    );
  });
  test(
    'pause drains inference; stale results discarded; resume uses one source',
    () async {
      final engine = Engine()..gate = Completer<void>();
      final source = Source();
      final c = controller(Memory(), engine, source: source);
      await c.start();
      final inference = c.processFrame(frame('old'));
      final stopped = c.stop();
      await Future<void>.delayed(Duration.zero);
      expect(engine.disposals, 0);
      engine.gate!.complete();
      await inference;
      await stopped;
      expect(c.latestObservation, isNull);
      expect(c.canLabel, isFalse);
      await c.start();
      await c.start();
      expect(source.starts, 2);
      await c.processFrame(frame('new'));
      expect(c.latestObservation?.frameId, 'new');
      await c.shutdown();
      await c.shutdown();
      c.dispose();
      await Future<void>.delayed(Duration.zero);
      expect(engine.disposals, 1);
      expect(source.listener, isNull);
    },
  );
  test('inference and pose errors are counted and persisted', () async {
    final memory = Memory();
    final engine = Engine()..poseFailure = true;
    final c = controller(memory, engine);
    await c.start();
    await c.processFrame(frame('pose-error'));
    expect(c.diagnostics.inferenceErrors, 1);
    engine.fail = true;
    await c.processFrame(frame('detector-error'));
    expect(c.diagnostics.inferenceErrors, 2);
    expect(c.canLabel, isFalse);
    await c.shutdown();
    final sessions = await VisionBenchmarkRepository(memory).loadSessions();
    expect((sessions.single['metrics'] as Map)['inferenceErrors'], 2);
  });
  test('duplicate owner taps persist one sample', () async {
    final memory = Memory();
    final c = controller(memory, Engine());
    await c.start();
    await c.processFrame(frame('one'));
    c.freezeForLabel();
    final writes = await Future.wait([
      c.recordGroundTruth(PoseShadowGroundTruth.sitLike),
      c.recordGroundTruth(PoseShadowGroundTruth.sitLike),
    ]);
    expect(writes.where((s) => s != null), hasLength(1));
    await c.shutdown();
  });
  test('invalid saved schema fails visibly', () async {
    final memory = Memory();
    final store = VisionBenchmarkRepository(memory);
    await store.save(context('A'), [], {});
    final index = jsonDecode(
      memory.data['${VisionBenchmarkRepository.prefix}.index']!,
    ) as List;
    memory.data[index.single as String] = '{"schemaVersion":99}';
    expect(store.loadSessions(), throwsFormatException);
  });
  testWidgets('QA selector displays concrete blockers without opening camera', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: PoseShadowCalibrationScreen.benchmark(dogId: 'dog'),
      ),
    );
    expect(find.text('Vision Calibration · QA'), findsOneWidget);
    expect(find.textContaining('Commercial redistribution'), findsOneWidget);
    final start = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Start new QA session'),
    );
    expect(start.onPressed, isNull);
    await tester.tap(find.byType(DropdownButtonFormField<int>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Model B: YOLO26n + RTMPose AP-10K').last);
    await tester.pumpAndSettle();
    expect(find.textContaining('Ultralytics closed-source'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
