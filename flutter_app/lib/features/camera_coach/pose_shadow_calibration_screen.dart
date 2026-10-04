import 'dart:async';
import 'dart:convert';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/gda_theme.dart';
import 'domain/camera_coach_models.dart';
import 'domain/pose_shadow_validation.dart';
import 'services/camera/flutter_camera_capture_adapter.dart';
import 'services/pose_shadow_performance.dart';
import 'services/pose_shadow_validation_controller.dart';
import 'services/pose_shadow_validation_repository.dart';
import 'services/vision/dog_vision_engine.dart';
import 'services/vision/qa_vision_candidate.dart';
import 'services/vision_benchmark_repository.dart';

typedef PoseShadowVisionEngineFactory = DogVisionEngine Function();

/// Engineering-only real-device calibration surface.
///
/// This screen is intentionally not registered in consumer navigation. It may
/// run candidate model bundles that are not production-approved, so its output
/// is restricted to shadow-validation storage and can never write lesson
/// progress, training history, rewards, or Adaptive Brain memory.
class PoseShadowCalibrationScreen extends StatefulWidget {
  const PoseShadowCalibrationScreen({
    super.key,
    required this.dogId,
    required this.lessonId,
    required this.expectedPosture,
    required this.visionEngineFactory,
    this.candidates = const [],
  });

  final String dogId;
  final String lessonId;
  final DogPosture expectedPosture;
  const PoseShadowCalibrationScreen.benchmark({
    super.key,
    required this.dogId,
    this.candidates = qaVisionCandidates,
  }) : lessonId = 'engineering-benchmark',
       expectedPosture = DogPosture.sitLike,
       visionEngineFactory = null;

  final PoseShadowVisionEngineFactory? visionEngineFactory;
  final List<QaVisionCandidate> candidates;

  @override
  State<PoseShadowCalibrationScreen> createState() =>
      _PoseShadowCalibrationScreenState();
}

class _PoseShadowCalibrationScreenState
    extends State<PoseShadowCalibrationScreen>
    with WidgetsBindingObserver {
  FlutterCameraCaptureAdapter? _camera;
  PoseShadowValidationController? _controller;

  bool _initializing = true;
  bool _switching = false;
  int _selected = 0;
  final _scenario = TextEditingController(
    text: 'standing-side-on-normal-light',
  );
  final _device = TextEditingController(
    text: 'Samsung Android (owner supplied)',
  );
  final _benchmarkStore = VisionBenchmarkRepository(
    const SharedPreferencesPoseShadowValidationStorage(),
  );
  VisionBenchmarkContext? _benchmarkContext;
  bool get _benchmark => widget.candidates.isNotEmpty;
  QaVisionCandidate get _candidate => widget.candidates[_selected];
  bool _resumeAfterLifecycle = false;
  bool _closing = false;
  Object? _setupError;
  Future<void> _lifecycleSerial = Future<void>.value();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    if (_benchmark) {
      _initializing = false;
    } else {
      _queueLifecycle(_bootstrap);
    }
  }

  Future<void> _bootstrap() async {
    if (!mounted || _closing || _controller != null || _camera != null) return;
    if (_benchmark && !_candidate.runnable) return;
    if (_benchmark) {
      _benchmarkContext = VisionBenchmarkContext(
        modelId: _candidate.id,
        modelVersion: _candidate.version,
        dogId: widget.dogId,
        sessionId: DateTime.now().toUtc().microsecondsSinceEpoch.toString(),
        scenario: _scenario.text.trim(),
        device: _device.text.trim(),
      );
    }
    setState(() => _initializing = true);
    final camera = FlutterCameraCaptureAdapter();
    _camera = camera;

    try {
      await camera.initialize();
      // dispose() releases resources after this serialized startup completes.
      if (!mounted) return;

      final controller = PoseShadowValidationController(
        frameSource: camera.createPollingSource(),
        visionEngine: _benchmark
            ? _candidate.createEngine()
            : widget.visionEngineFactory!(),
        repository: PoseShadowValidationRepository(
          storage: const SharedPreferencesPoseShadowValidationStorage(),
          namespace: _benchmarkContext == null
              ? PoseShadowValidationRepository.storageKey
              : '${VisionBenchmarkRepository.prefix}.shadow.${_benchmarkContext!.partition}',
        ),
        benchmarkContext: _benchmarkContext,
        benchmarkRepository: _benchmark ? _benchmarkStore : null,
        dogId: widget.dogId,
        lessonId: widget.lessonId,
        expectedPosture: widget.expectedPosture,
      );
      controller.addListener(_controllerChanged);
      _controller = controller;

      setState(() {
        _initializing = false;
        _setupError = null;
      });
      await controller.start();
      if (mounted) setState(() {});
    } catch (cause) {
      if (!mounted) return;
      final failedController = _controller;
      _controller = null;
      failedController?.removeListener(_controllerChanged);
      try {
        await failedController?.shutdown();
      } finally {
        failedController?.dispose();
      }
      await camera.shutdown();
      camera.dispose();
      _camera = null;
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _setupError = cause;
      });
    }
  }

  void _controllerChanged() {
    if (mounted) setState(() {});
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _queueLifecycle(_resumeFromLifecycle);
      return;
    }

    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.hidden ||
        state == AppLifecycleState.detached) {
      _queueLifecycle(_suspendForLifecycle);
    }
  }

  void _queueLifecycle(Future<void> Function() action) {
    _lifecycleSerial = _lifecycleSerial
        .then((_) async {
          if (mounted) await action();
        })
        .catchError((Object cause, StackTrace _) {
          if (mounted) setState(() => _setupError = cause);
        });
  }

  Future<void> _suspendForLifecycle() async {
    final controller = _controller;
    final camera = _camera;
    if (controller == null || camera == null) return;

    _resumeAfterLifecycle =
        _resumeAfterLifecycle ||
        controller.status == PoseShadowControllerStatus.ready ||
        controller.status == PoseShadowControllerStatus.loading;

    await controller.stop();
    await camera.shutdown();
    if (mounted) setState(() {});
  }

  Future<void> _resumeFromLifecycle() async {
    if (!_resumeAfterLifecycle || _closing) return;

    final controller = _controller;
    final camera = _camera;
    if (controller == null || camera == null) return;

    try {
      await camera.initialize();
      await controller.start();
      _resumeAfterLifecycle = false;
      if (mounted) setState(() => _setupError = null);
    } catch (cause) {
      if (mounted) setState(() => _setupError = cause);
    }
  }

  Future<void> _record(PoseShadowGroundTruth truth) async {
    final controller = _controller;
    if (controller == null) return;
    try {
      await controller.recordGroundTruth(truth);
    } catch (cause) {
      if (mounted) setState(() => _setupError = cause);
    }
  }

  Future<void> _retry() async {
    if (_switching || _closing) return;
    _queueLifecycle(_restart);
  }

  Future<void> _restart() async {
    if (_initializing) return;

    final oldController = _controller;
    final oldCamera = _camera;
    _controller = null;
    _camera = null;
    oldController?.removeListener(_controllerChanged);
    await _release(oldController, oldCamera);

    if (mounted) {
      setState(() {
        _initializing = true;
        _setupError = null;
      });
    }
    if (_benchmark && !_candidate.runnable) {
      if (mounted) setState(() => _initializing = false);
    } else {
      await _bootstrap();
    }
  }

  Future<void> _select(int index) async {
    if (_switching || _closing) return;
    setState(() => _switching = true);
    _queueLifecycle(() async {
      try {
        final old = _controller;
        _controller = null;
        old?.removeListener(_controllerChanged);
        final camera = _camera;
        _camera = null;
        await _release(old, camera);
        if (!mounted) return;
        setState(() {
          _selected = index;
          _benchmarkContext = null;
          _setupError = null;
          _initializing = false;
          _resumeAfterLifecycle = false;
        });
      } finally {
        if (mounted) setState(() => _switching = false);
      }
    });
  }

  Future<void> _comparison() async {
    try {
      await _controller?.saveBenchmarkSnapshot();
      final sessions = await _benchmarkStore.loadSessions();
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        builder: (context) => SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('A/B sessions · no automatic winner'),
                  const Text(
                    'Compare the same dog, scenario, device and protocol. '
                    'Live runs are NOT identical source frames.',
                  ),
                  if (sessions.isEmpty)
                    const Text('No saved benchmark sessions yet.'),
                  for (final session in sessions) ...[
                    const Divider(),
                    Text(
                      (session['context'] as Map).entries
                          .map((entry) => '${entry.key}: ${entry.value}')
                          .join(' · '),
                    ),
                    _BenchmarkSummary(
                      labels: (session['labels'] as List)
                          .map(
                            (value) => (value as Map).cast<String, Object?>(),
                          )
                          .toList(),
                    ),
                    Text('Performance: ${jsonEncode(session['metrics'])}'),
                  ],
                  TextButton(
                    onPressed: () async {
                      await Clipboard.setData(
                        ClipboardData(
                          text: const JsonEncoder.withIndent('  ')
                              .convert(sessions),
                        ),
                      );
                    },
                    child: const Text('Copy complete QA report JSON'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    } catch (cause) {
      if (mounted) setState(() => _setupError = cause);
    }
  }

  Future<void> _close() async {
    if (_closing) return;
    _closing = true;
    _queueLifecycle(() async {
      try {
        await _controller?.shutdown();
        await _camera?.shutdown();
        if (mounted) Navigator.of(context).pop();
      } catch (cause) {
        _closing = false;
        if (mounted) setState(() => _setupError = cause);
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);

    _controller?.removeListener(_controllerChanged);
    _scenario.dispose();
    _device.dispose();
    unawaited(
      _lifecycleSerial
          .then((_) async {
            final controller = _controller;
            final camera = _camera;
            _controller = null;
            _camera = null;
            await _release(controller, camera);
          })
          .catchError((Object cause) {
            debugPrint('QA resource shutdown failed: $cause');
          }),
    );
    super.dispose();
  }

  Future<void> _release(
    PoseShadowValidationController? controller,
    FlutterCameraCaptureAdapter? camera,
  ) async {
    try {
      await controller?.shutdown();
    } finally {
      controller?.dispose();
      try {
        await camera?.shutdown();
      } finally {
        camera?.dispose();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_close());
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Close calibration',
            onPressed: _close,
            icon: const Icon(Icons.close),
          ),
          title: const Text('Vision Calibration · QA'),
        ),
        body: SafeArea(child: _body()),
      ),
    );
  }

  Widget _body() {
    if (_initializing) {
      return const Center(
        child: CircularProgressIndicator(
          semanticsLabel: 'Starting vision calibration',
        ),
      );
    }

    final controller = _controller;
    if (controller == null && !_benchmark) {
      return _StartupError(onRetry: _retry);
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 28),
      children: [
        const _QaBanner(),
        if (_benchmark) ...[
          const SizedBox(height: 12),
          DropdownButtonFormField<int>(
            initialValue: _selected,
            isExpanded: true,
            decoration: const InputDecoration(labelText: 'VISION ENGINE'),
            items: [
              for (var i = 0; i < widget.candidates.length; i++)
                DropdownMenuItem(
                  value: i,
                  child: Text(
                    widget.candidates[i].name,
                    maxLines: 2,
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
            ],
            onChanged: _switching
                ? null
                : (value) {
                    if (value != null && value != _selected) {
                      unawaited(_select(value));
                    }
                  },
          ),
          Text('Model: ${_candidate.id}@${_candidate.version}'),
          Text('Dog: ${widget.dogId}'),
          TextField(
            controller: _scenario,
            enabled: controller == null && !_switching,
            decoration: const InputDecoration(
              labelText: 'Scenario (posture, angle, light)',
            ),
          ),
          TextField(
            controller: _device,
            enabled: controller == null && !_switching,
            decoration: const InputDecoration(
              labelText: 'Phone / Android version (enter manually)',
            ),
          ),
          for (final blocker in _candidate.blockers) Text('Blocked: $blocker'),
          if (controller == null)
            FilledButton(
              onPressed: !_switching && _candidate.runnable
                  ? () => _queueLifecycle(_bootstrap)
                  : null,
              child: const Text('Start new QA session'),
            ),
          TextButton(
            onPressed: _comparison,
            child: const Text('Compare saved sessions / export'),
          ),
          if (_benchmarkContext != null)
            Text('Session: ${_benchmarkContext!.sessionId}'),
        ],
        if (controller != null) ...[
          const SizedBox(height: 12),
          _cameraPreview(),
          const SizedBox(height: 12),
          _PredictionCard(controller: controller),
          const SizedBox(height: 12),
          _GroundTruthCard(enabled: controller.canLabel, onRecord: _record),
          const SizedBox(height: 12),
          if (_benchmark)
            _BenchmarkSummary(labels: controller.benchmarkLabels)
          else
            _ValidationProgressCard(
              expectedPosture: widget.expectedPosture,
              summary: controller.summary,
            ),
          const SizedBox(height: 12),
          if (_benchmark)
            Text(
              'Camera busy skips: ${controller.captureBusySkips ?? 'unavailable'} · '
              'capture errors: ${controller.captureErrors ?? 'unavailable'}',
            ),
          _DiagnosticsCard(
            diagnostics: controller.diagnostics,
            performance: controller.performanceReport,
          ),
          if (controller.status == PoseShadowControllerStatus.error)
            Text(
              'Analysis stopped: ${controller.error}. Close or select another model.',
            ),
          if (controller.status == PoseShadowControllerStatus.error)
            TextButton(onPressed: _retry, child: const Text('Try again')),
        ],
        if (_setupError != null) ...[
          const SizedBox(height: 12),
          _Notice(text: 'QA stopped or could not save: $_setupError'),
        ],
      ],
    );
  }

  Widget _cameraPreview() {
    final camera = _camera?.controller;
    if (camera == null || !camera.value.isInitialized) {
      return AspectRatio(
        aspectRatio: 4 / 3,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Center(
            child: Text('Camera paused', style: TextStyle(color: Colors.white)),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: AspectRatio(
        aspectRatio: camera.value.aspectRatio,
        child: CameraPreview(camera),
      ),
    );
  }
}

class _QaBanner extends StatelessWidget {
  const _QaBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2D8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GdaColors.gold),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.science_outlined, color: GdaColors.gold),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'QA ONLY · These labels test a candidate model. They do not '
              'complete lessons, score reps, give rewards, or change the '
              'Adaptive Brain.',
            ),
          ),
        ],
      ),
    );
  }
}

class _PredictionCard extends StatelessWidget {
  const _PredictionCard({required this.controller});

  final PoseShadowValidationController controller;

  @override
  Widget build(BuildContext context) {
    final observation = controller.latestObservation;
    final detected =
        observation?.rawDogDetected ?? observation?.dogDetected ?? false;
    final prediction = observation?.posture;
    final confidence = observation?.postureConfidence;
    final detectionConfidence = observation?.detectionConfidence;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Candidate model prediction',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            Text(
              observation == null
                  ? 'Waiting for the first analysed frame…'
                  : detected
                  ? '${dogPostureQaLabel(prediction)} · '
                        '${formatQaPercent(confidence)}'
                  : 'No dog detected',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              observation == null
                  ? 'Do not label until a prediction appears.'
                  : 'Dog detection: ${formatQaPercent(detectionConfidence)}',
            ),
            Text(
              'Tracking: ${observation?.trackingState?.name ?? 'unavailable'}',
            ),
            if (!controller.canLabel && observation != null) ...[
              const SizedBox(height: 8),
              const Text(
                'Labelling is paused or this frame is already labelled. Use the QA controls below.',
                style: TextStyle(color: GdaColors.muted),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _GroundTruthCard extends StatelessWidget {
  const _GroundTruthCard({required this.enabled, required this.onRecord});

  final bool enabled;
  final Future<void> Function(PoseShadowGroundTruth truth) onRecord;

  @override
  Widget build(BuildContext context) {
    const labels = <(PoseShadowGroundTruth, String)>[
      (PoseShadowGroundTruth.standLike, 'Stand'),
      (PoseShadowGroundTruth.sitLike, 'Sit'),
      (PoseShadowGroundTruth.downLike, 'Down'),
      (PoseShadowGroundTruth.noDog, 'No dog'),
      (PoseShadowGroundTruth.unsure, 'Unsure'),
    ];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'What is actually in the frame?',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            const Text(
              'Label what you can see, regardless of what the model predicted.',
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final label in labels)
                  FilledButton.tonal(
                    onPressed: enabled ? () => onRecord(label.$1) : null,
                    child: Text(label.$2),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ValidationProgressCard extends StatelessWidget {
  const _ValidationProgressCard({
    required this.expectedPosture,
    required this.summary,
  });

  final DogPosture expectedPosture;
  final PoseShadowValidationSummary? summary;

  @override
  Widget build(BuildContext context) {
    final report = summary?.byPosture[expectedPosture];
    final labelled = report?.labelledSamples ?? 0;
    final remaining =
        defaultPoseShadowValidationPolicy.minimumSamples - labelled;
    final needed = remaining > 0 ? remaining : 0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${dogPostureQaLabel(expectedPosture)} validation',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 10),
            Text(
              '$labelled / '
              '${defaultPoseShadowValidationPolicy.minimumSamples} '
              'owner-labelled samples',
            ),
            const SizedBox(height: 6),
            Text(
              'Precision: ${formatQaPercent(report?.precision)}  ·  '
              'False positives: ${formatQaPercent(report?.falsePositiveRate)}  ·  '
              'Coverage: ${formatQaPercent(report?.coverage)}',
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  report?.shadowQualityGatePassed == true
                      ? Icons.check_circle
                      : Icons.pending_outlined,
                  color: report?.shadowQualityGatePassed == true
                      ? GdaColors.forest
                      : GdaColors.gold,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    report?.shadowQualityGatePassed == true
                        ? 'Statistical shadow gate passed.'
                        : needed > 0
                        ? '$needed more labelled samples required before '
                              'quality thresholds can pass.'
                        : 'Quality thresholds are not met yet.',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'Production auto-scoring: DISABLED',
              style: TextStyle(
                color: GdaColors.muted,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DiagnosticsCard extends StatelessWidget {
  const _DiagnosticsCard({
    required this.diagnostics,
    required this.performance,
  });

  final PoseShadowDiagnostics diagnostics;
  final PoseShadowPerformanceReport performance;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Device diagnostics',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text('Analysed frames: ${diagnostics.framesAnalysed}'),
            Text('Busy frames skipped: ${diagnostics.framesSkippedBusy}'),
            Text('Inference errors: ${diagnostics.inferenceErrors}'),
            Text(
              'Last analysis time (excludes capture): '
              '${diagnostics.lastTotalMs == null ? '—' : '${diagnostics.lastTotalMs} ms'}',
            ),
            const SizedBox(height: 6),
            Text(
              'Latency P50 / P95 / max: '
              '${formatQaMilliseconds(performance.p50Ms)} / '
              '${formatQaMilliseconds(performance.p95Ms)} / '
              '${formatQaMilliseconds(performance.maxMs)}',
            ),
            Text(
              'Analysis yield: ${formatQaPercent(performance.analysisYield)}',
            ),
            Text(
              'Busy skip rate: ${formatQaPercent(performance.busySkipRate)}',
            ),
            Text(
              'Inference error rate: ${formatQaPercent(performance.errorRate)}',
            ),
            Text('Latency samples retained: ${performance.latencySamples}'),
          ],
        ),
      ),
    );
  }
}

class _StartupError extends StatelessWidget {
  const _StartupError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 52, color: GdaColors.gold),
            const SizedBox(height: 12),
            Text(
              'Vision calibration could not run',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Check the candidate model files, camera permission, and runtime configuration.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: onRetry, child: const Text('Try again')),
          ],
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2D8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(text),
    );
  }
}

String dogPostureQaLabel(DogPosture? posture) {
  return switch (posture) {
    DogPosture.standLike => 'Stand',
    DogPosture.sitLike => 'Sit',
    DogPosture.downLike => 'Down',
    null => 'Unknown',
  };
}

String formatQaPercent(double? value) {
  if (value == null || !value.isFinite) return '—';
  return '${(value.clamp(0.0, 1.0) * 100).toStringAsFixed(1)}%';
}

String formatQaMilliseconds(int? value) => value == null ? '—' : '$value ms';

class _BenchmarkSummary extends StatelessWidget {
  const _BenchmarkSummary({required this.labels});
  final List<Map<String, Object?>> labels;

  @override
  Widget build(BuildContext context) {
    final report = summarizeBenchmarkLabels(labels);
    final dog = report['dog'] as Map;
    final postures = report['postures'] as Map;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Labelled: ${report['samples']} · Unsure excluded: ${report['unsure']}',
        ),
        Text(
          'Dog TP ${dog['tp']} / FP ${dog['fp']} / FN ${dog['fn']} / TN ${dog['tn']}',
        ),
        Text(
          'Dog precision ${formatQaPercent(dog['precision'] as double?)} · '
          'recall ${formatQaPercent(dog['recall'] as double?)} · '
          'FPR ${formatQaPercent(dog['falsePositiveRate'] as double?)}',
        ),
        Text(
          'Posture coverage: ${formatQaPercent(report['coverage'] as double?)}',
        ),
        for (final entry in postures.entries)
          Text(
            '${entry.key}: TP ${(entry.value as Map)['tp']} / '
            'FP ${(entry.value as Map)['fp']} / FN ${(entry.value as Map)['fn']} · '
            'precision ${formatQaPercent((entry.value as Map)['precision'] as double?)} · '
            'recall ${formatQaPercent((entry.value as Map)['recall'] as double?)}',
          ),
        const Text(
          'UNKNOWN remains UNKNOWN. These results do not approve production.',
        ),
      ],
    );
  }
}
