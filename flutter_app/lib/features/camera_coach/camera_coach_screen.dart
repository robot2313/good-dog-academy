import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../lessons/progress/lesson_progress_controller.dart';
import '../lessons/session/training_session_record.dart';
import 'domain/camera_coach_orchestrator.dart';
import 'domain/expected_cue_response.dart';
import 'domain/live_coach_engine.dart';
import 'services/camera/flutter_camera_capture_adapter.dart';
import 'services/flutter_coach_speech.dart';
import 'services/flutter_training_speech_recognizer.dart';
import 'services/hands_free_coach_controller.dart';
import 'services/camera_coach_experience_controller.dart';
import 'services/camera_coach_runtime_controller.dart';
import 'services/camera_coach_session_persistence_service.dart';
import 'services/camera_coach_voice_command_router.dart';
import 'services/spoken_coach_controller.dart';
import 'services/vision/dog_vision_engine.dart';

typedef CameraCoachVisionEngineFactory = DogVisionEngine Function();

/// Production Camera Coach shell.
///
/// This screen is intentionally not linked from normal lesson navigation until
/// a commercial-safe real vision engine is supplied. It contains no fake AI:
/// callers must provide [visionEngineFactory].
class CameraCoachScreen extends StatefulWidget {
  const CameraCoachScreen({
    super.key,
    required this.lessonId,
    required this.ownerId,
    required this.dogId,
    required this.dogName,
    required this.visionEngineFactory,
    this.dailyPlanId,
    this.allowPrerequisiteBypass = false,
    this.targetReps = 5,
  });

  final String lessonId;
  final String ownerId;
  final String dogId;
  final String dogName;
  final String? dailyPlanId;
  final bool allowPrerequisiteBypass;
  final int targetReps;
  final CameraCoachVisionEngineFactory visionEngineFactory;

  @override
  State<CameraCoachScreen> createState() => _CameraCoachScreenState();
}

class _CameraCoachScreenState extends State<CameraCoachScreen>
    with WidgetsBindingObserver {
  FlutterCameraCaptureAdapter? _camera;
  CameraCoachExperienceController? _experience;
  CameraCoachVoiceCommandRouter? _voiceRouter;
  LessonProgressController? _progress;

  bool _bootstrapStarted = false;
  bool _initializing = true;
  bool _closing = false;
  bool _resumeAfterLifecyclePause = false;
  bool _resumeHandsFreeAfterLifecycle = false;
  Object? _setupError;
  Future<void> _lifecycleSerial = Future<void>.value();

  CameraCoachRuntimeController? get _runtime => _experience?.runtime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_bootstrapStarted) return;

    _bootstrapStarted = true;
    final progress = LessonProgressScope.of(context);
    _progress = progress;

    if (progress.ownerId != widget.ownerId || progress.dogId != widget.dogId) {
      _initializing = false;
      _setupError = StateError(
        'The selected dog changed before Camera Coach could start.',
      );
      return;
    }

    unawaited(_bootstrap(progress));
  }

  Future<void> _bootstrap(LessonProgressController progress) async {
    final camera = FlutterCameraCaptureAdapter();
    _camera = camera;

    try {
      await camera.initialize();
      if (!mounted) {
        await camera.shutdown();
        camera.dispose();
        return;
      }

      final source = camera.createPollingSource();
      final now = DateTime.now().toUtc();
      final session = createLiveCoachSession(
        id: 'camera-session-${widget.dogId}-${now.microsecondsSinceEpoch}',
        dogId: widget.dogId,
        lessonId: widget.lessonId,
        targetReps: widget.targetReps < 1 ? 1 : widget.targetReps,
      );
      final orchestrator = CameraCoachOrchestrator.withDefaults(
        session: session,
        visionEngine: widget.visionEngineFactory(),
      );
      final runtime = CameraCoachRuntimeController(
        frameSource: source,
        orchestrator: orchestrator,
        dogName: widget.dogName,
        cueResponse: expectedCueResponseForLesson(widget.lessonId),
        spokenCoach: SpokenCoachController(FlutterCoachSpeech()),
      );
      final experience = CameraCoachExperienceController(
        runtime: runtime,
        persister: CameraCoachSessionPersistenceService(
          progressController: progress,
        ),
        ownerId: widget.ownerId,
        dogId: widget.dogId,
        dailyPlanId: widget.dailyPlanId,
        allowPrerequisiteBypass: widget.allowPrerequisiteBypass,
      );
      final voiceRouter = CameraCoachVoiceCommandRouter(
        handsFree: HandsFreeCoachController(
          FlutterTrainingSpeechRecognizer(),
        ),
        actions: ExperienceCameraCoachVoiceActions(experience),
        sessionChanges: experience,
      );
      voiceRouter.addListener(_voiceRouterChanged);

      experience.addListener(_experienceChanged);
      _experience = experience;
      _voiceRouter = voiceRouter;

      if (mounted) {
        setState(() {
          _initializing = false;
          _setupError = null;
        });
      }

      await experience.start();
      if (mounted) setState(() {});
    } catch (cause) {
      await camera.shutdown();
      if (!mounted) {
        camera.dispose();
        return;
      }
      setState(() {
        _initializing = false;
        _setupError = cause;
      });
    }
  }

  void _experienceChanged() {
    if (mounted) setState(() {});
  }

  void _voiceRouterChanged() {
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
    _lifecycleSerial = _lifecycleSerial.then((_) => action()).catchError((
      Object cause,
      StackTrace _,
    ) {
      if (mounted) setState(() => _setupError = cause);
    });
  }

  Future<void> _suspendForLifecycle() async {
    final experience = _experience;
    final camera = _camera;
    final voiceRouter = _voiceRouter;
    if (experience == null || camera == null) return;

    _resumeHandsFreeAfterLifecycle = voiceRouter?.enabled ?? false;
    if (_resumeHandsFreeAfterLifecycle) {
      await voiceRouter!.setEnabled(false);
    }

    final status = experience.runtime.status;
    _resumeAfterLifecyclePause =
        status != CameraCoachRuntimeStatus.paused &&
        status != CameraCoachRuntimeStatus.complete &&
        status != CameraCoachRuntimeStatus.error;

    if (_resumeAfterLifecyclePause) {
      await experience.pause();
    }
    await camera.shutdown();

    if (mounted) setState(() {});
  }

  Future<void> _resumeFromLifecycle() async {
    if ((!_resumeAfterLifecyclePause && !_resumeHandsFreeAfterLifecycle) ||
        _closing) {
      return;
    }

    final experience = _experience;
    final camera = _camera;
    final voiceRouter = _voiceRouter;
    if (experience == null || camera == null) return;

    try {
      await camera.initialize();
      if (_resumeAfterLifecyclePause) {
        await experience.resume();
      }
      if (_resumeHandsFreeAfterLifecycle && voiceRouter != null) {
        await voiceRouter.setEnabled(true);
      }
      _resumeAfterLifecyclePause = false;
      _resumeHandsFreeAfterLifecycle = false;
      if (mounted) setState(() => _setupError = null);
    } catch (cause) {
      if (mounted) setState(() => _setupError = cause);
    }
  }

  Future<void> _beginRep() async {
    await _experience?.beginCue();
  }

  Future<void> _confirm(TrainingOutcome outcome) async {
    await _experience?.confirmPending(outcome);
  }

  Future<void> _togglePause() async {
    final experience = _experience;
    final camera = _camera;
    if (experience == null || camera == null) return;

    if (experience.runtime.status == CameraCoachRuntimeStatus.paused) {
      try {
        if (!camera.initialized) await camera.initialize();
        await experience.resume();
        _resumeAfterLifecyclePause = false;
        if (mounted) setState(() => _setupError = null);
      } catch (cause) {
        if (mounted) setState(() => _setupError = cause);
      }
    } else {
      await experience.pause();
    }
  }

  Future<void> _stopSession() async {
    await _experience?.stop();
  }

  Future<void> _retrySave() async {
    await _experience?.retrySave();
  }

  Future<void> _setHandsFreeEnabled(bool enabled) async {
    final router = _voiceRouter;
    if (router == null) return;
    await router.setEnabled(enabled);
    if (mounted) setState(() {});
  }

  bool _safeToLeave(CameraCoachSaveState state) {
    return state == CameraCoachSaveState.saved ||
        state == CameraCoachSaveState.qaComplete ||
        state == CameraCoachSaveState.noTrainingEvidence;
  }

  Future<void> _finishAndClose() async {
    if (_closing) return;
    _closing = true;

    final voiceRouter = _voiceRouter;
    if (voiceRouter?.enabled ?? false) {
      await voiceRouter!.setEnabled(false);
    }

    final experience = _experience;
    if (experience != null &&
        experience.runtime.status != CameraCoachRuntimeStatus.complete) {
      await experience.stop();
    }

    final saveState = experience?.saveState;
    if (experience != null &&
        experience.runtime.status == CameraCoachRuntimeStatus.complete &&
        (saveState == CameraCoachSaveState.error ||
            saveState == CameraCoachSaveState.saving ||
            saveState == CameraCoachSaveState.idle)) {
      _closing = false;
      if (mounted) setState(() {});
      return;
    }

    if (saveState != null && !_safeToLeave(saveState)) {
      _closing = false;
      return;
    }

    await _camera?.shutdown();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);

    final experience = _experience;
    final camera = _camera;
    final voiceRouter = _voiceRouter;
    _experience = null;
    _camera = null;
    _voiceRouter = null;

    if (experience != null) {
      experience.removeListener(_experienceChanged);
    }
    if (voiceRouter != null) {
      voiceRouter.removeListener(_voiceRouterChanged);
    }
    unawaited(_releaseResources(experience, camera, voiceRouter));

    super.dispose();
  }

  Future<void> _releaseResources(
    CameraCoachExperienceController? experience,
    FlutterCameraCaptureAdapter? camera,
    CameraCoachVoiceCommandRouter? voiceRouter,
  ) async {
    await voiceRouter?.shutdown();
    voiceRouter?.dispose();
    await experience?.shutdown();
    await camera?.shutdown();
    camera?.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) unawaited(_finishAndClose());
      },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(
            tooltip: 'Close Camera Coach',
            onPressed: _finishAndClose,
            icon: const Icon(Icons.close),
          ),
          title: const Text('Camera Coach'),
        ),
        body: SafeArea(child: _body()),
      ),
    );
  }

  Widget _body() {
    if (_initializing) {
      return const Center(
        child: CircularProgressIndicator(
          semanticsLabel: 'Starting Camera Coach',
        ),
      );
    }

    if (_setupError != null && _experience == null) {
      return _SetupError(onRetry: _retryBootstrap);
    }

    final experience = _experience;
    final runtime = _runtime;
    if (experience == null || runtime == null) {
      return _SetupError(onRetry: _retryBootstrap);
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      children: [
        _cameraPreview(),
        const SizedBox(height: 14),
        _StatusCard(
          runtime: runtime,
          experience: experience,
          voiceRouter: _voiceRouter,
          onHandsFreeChanged: _setHandsFreeEnabled,
        ),
        if (_setupError != null) ...[
          const SizedBox(height: 12),
          const _Notice(
            icon: Icons.camera_alt_outlined,
            text:
                'The camera could not resume. Check camera permission, then try resuming Camera Coach again.',
          ),
        ],
        const SizedBox(height: 14),
        if (runtime.status ==
            CameraCoachRuntimeStatus.awaitingOwnerConfirmation)
          _OwnerConfirmation(onConfirm: _confirm)
        else if (runtime.status == CameraCoachRuntimeStatus.complete)
          _Completion(
            experience: experience,
            onRetrySave: _retrySave,
            onDone: _finishAndClose,
          )
        else
          _SessionControls(
            runtime: runtime,
            onBeginRep: _beginRep,
            onTogglePause: _togglePause,
            onStop: _stopSession,
          ),
      ],
    );
  }

  Future<void> _retryBootstrap() async {
    final progress = _progress;
    if (progress == null || _initializing) return;

    final oldVoiceRouter = _voiceRouter;
    _voiceRouter = null;
    if (oldVoiceRouter != null) {
      oldVoiceRouter.removeListener(_voiceRouterChanged);
      await oldVoiceRouter.shutdown();
      oldVoiceRouter.dispose();
    }

    final oldExperience = _experience;
    _experience = null;
    if (oldExperience != null) {
      oldExperience.removeListener(_experienceChanged);
      await oldExperience.shutdown();
    }

    final oldCamera = _camera;
    _camera = null;
    if (oldCamera != null) {
      await oldCamera.shutdown();
      oldCamera.dispose();
    }

    if (mounted) {
      setState(() {
        _initializing = true;
        _setupError = null;
      });
    }
    await _bootstrap(progress);
  }

  Widget _cameraPreview() {
    final camera = _camera?.controller;
    if (camera == null || !camera.value.isInitialized) {
      return AspectRatio(
        aspectRatio: 4 / 3,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(16),
          ),
          alignment: Alignment.center,
          child: const Text(
            'Camera paused',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: AspectRatio(
        aspectRatio: camera.value.aspectRatio,
        child: Stack(
          fit: StackFit.expand,
          children: [
            CameraPreview(camera),
            Center(
              child: FractionallySizedBox(
                widthFactor: 0.72,
                heightFactor: 0.72,
                child: IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white, width: 2),
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  const _StatusCard({
    required this.runtime,
    required this.experience,
    required this.voiceRouter,
    required this.onHandsFreeChanged,
  });

  final CameraCoachRuntimeController runtime;
  final CameraCoachExperienceController experience;
  final CameraCoachVoiceCommandRouter? voiceRouter;
  final Future<void> Function(bool enabled) onHandsFreeChanged;

  @override
  Widget build(BuildContext context) {
    final framing = runtime.framing;
    final automatic = runtime.automaticScoringEnabled;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.pets, color: GdaColors.forest),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${runtime.session.reps.length} of '
                    '${runtime.session.targetReps} reps',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _ModeChip(
                  text: automatic
                      ? 'Auto when confident'
                      : 'Owner confirmation',
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              framing?.instruction ?? _runtimeMessage(runtime.status),
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 8),
            SwitchListTile.adaptive(
              contentPadding: EdgeInsets.zero,
              title: const Text('Hands-free commands'),
              subtitle: Text(
                voiceRouter?.feedback?.message ??
                    'Say next rep, pause, resume, repeat, stop, or confirm a rep.',
              ),
              value: voiceRouter?.enabled ?? false,
              onChanged: runtime.status == CameraCoachRuntimeStatus.complete
                  ? null
                  : onHandsFreeChanged,
            ),
            if (experience.saveState == CameraCoachSaveState.saving) ...[
              const SizedBox(height: 10),
              const LinearProgressIndicator(
                semanticsLabel: 'Saving Camera Coach session',
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: GdaColors.selected,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: GdaColors.forest,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _OwnerConfirmation extends StatelessWidget {
  const _OwnerConfirmation({required this.onConfirm});

  final Future<void> Function(TrainingOutcome outcome) onConfirm;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text(
              'What happened on that rep?',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Camera Coach is not confident enough to score this automatically.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () => onConfirm(TrainingOutcome.success),
                child: const Text('Success'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => onConfirm(TrainingOutcome.partialSuccess),
                child: const Text('Partial success'),
              ),
            ),
            TextButton(
              onPressed: () => onConfirm(TrainingOutcome.unsuccessful),
              child: const Text('Unsuccessful'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SessionControls extends StatelessWidget {
  const _SessionControls({
    required this.runtime,
    required this.onBeginRep,
    required this.onTogglePause,
    required this.onStop,
  });

  final CameraCoachRuntimeController runtime;
  final Future<void> Function() onBeginRep;
  final Future<void> Function() onTogglePause;
  final Future<void> Function() onStop;

  @override
  Widget build(BuildContext context) {
    final paused = runtime.status == CameraCoachRuntimeStatus.paused;
    final watching = runtime.status == CameraCoachRuntimeStatus.cueActive;
    final ready = cameraCoachCanBeginRep(
      runtime.status,
      runtime.framing?.ready ?? false,
    );

    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            onPressed: ready ? onBeginRep : null,
            icon: Icon(watching ? Icons.visibility : Icons.play_arrow),
            label: Text(watching ? 'Watching this rep…' : 'Start next rep'),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: watching || ready || paused ? onTogglePause : null,
                icon: Icon(paused ? Icons.play_arrow : Icons.pause),
                label: Text(paused ? 'Resume' : 'Pause'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextButton(
                onPressed: onStop,
                child: const Text('End session'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Completion extends StatelessWidget {
  const _Completion({
    required this.experience,
    required this.onRetrySave,
    required this.onDone,
  });

  final CameraCoachExperienceController experience;
  final Future<void> Function() onRetrySave;
  final Future<void> Function() onDone;

  @override
  Widget build(BuildContext context) {
    final saveState = experience.saveState;
    final saved = saveState == CameraCoachSaveState.saved ||
        saveState == CameraCoachSaveState.qaComplete ||
        saveState == CameraCoachSaveState.noTrainingEvidence;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          children: [
            Icon(
              saveState == CameraCoachSaveState.error
                  ? Icons.error_outline
                  : Icons.check_circle,
              size: 54,
              color: saveState == CameraCoachSaveState.error
                  ? Theme.of(context).colorScheme.error
                  : GdaColors.forest,
            ),
            const SizedBox(height: 10),
            Text(
              saveState == CameraCoachSaveState.error
                  ? 'Session finished — save needs attention'
                  : 'Camera Coach session complete',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _saveMessage(saveState),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            if (saveState == CameraCoachSaveState.error)
              FilledButton(
                onPressed: onRetrySave,
                child: const Text('Try saving again'),
              )
            else if (saved)
              FilledButton(
                onPressed: onDone,
                child: const Text('Done'),
              )
            else
              const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

class _SetupError extends StatelessWidget {
  const _SetupError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.camera_alt_outlined,
              size: 54,
              color: GdaColors.forest,
            ),
            const SizedBox(height: 14),
            Text(
              'Camera Coach could not start',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'Check camera permission and make sure no other app is using the camera, then try again.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Notice extends StatelessWidget {
  const _Notice({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2D8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: GdaColors.gold),
          const SizedBox(width: 10),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}

String _runtimeMessage(CameraCoachRuntimeStatus status) {
  return switch (status) {
    CameraCoachRuntimeStatus.idle => 'Getting ready…',
    CameraCoachRuntimeStatus.warming => 'Preparing Camera Coach…',
    CameraCoachRuntimeStatus.ready =>
      'Keep your dog in frame, then start a rep.',
    CameraCoachRuntimeStatus.cueActive =>
      'Watching for your dog’s response…',
    CameraCoachRuntimeStatus.awaitingOwnerConfirmation =>
      'Waiting for your confirmation.',
    CameraCoachRuntimeStatus.paused => 'Camera Coach is paused.',
    CameraCoachRuntimeStatus.complete => 'Session complete.',
    CameraCoachRuntimeStatus.error =>
      'Camera Coach needs attention before continuing.',
  };
}

String _saveMessage(CameraCoachSaveState state) {
  return switch (state) {
    CameraCoachSaveState.idle => 'Finalising your session…',
    CameraCoachSaveState.saving => 'Saving training evidence…',
    CameraCoachSaveState.saved =>
      'Training evidence was saved and can inform future plans.',
    CameraCoachSaveState.qaComplete =>
      'QA session complete. No production training history was changed.',
    CameraCoachSaveState.noTrainingEvidence =>
      'No scored reps were recorded, so training history was not changed.',
    CameraCoachSaveState.error =>
      'Your session is still on this screen. Retry before leaving if you want this evidence saved.',
  };
}


bool cameraCoachCanBeginRep(
  CameraCoachRuntimeStatus status,
  bool framingReady,
) {
  return status == CameraCoachRuntimeStatus.ready && framingReady;
}
