import '../../lessons/session/training_session_record.dart';
import 'camera_coach_models.dart';
import 'camera_evidence.dart';
import 'live_coach_engine.dart';
import 'posture_buffer.dart';
import 'temporal_rep_gate.dart';
import '../services/camera/camera_frame_source.dart';
import '../services/vision/dog_vision_engine.dart';

enum CameraCoachFrameKind {
  throttled,
  busy,
  waitingForTemporal,
  waitingForTransition,
  dogNotInView,
  sessionComplete,
  ownerConfirmation,
  repRecorded,
}

class CameraCoachPendingConfirmation {
  const CameraCoachPendingConfirmation({
    required this.vision,
    required this.observation,
    required this.reason,
  });

  final DogVisionResult vision;
  final CameraRepObservation observation;
  final CameraEvidenceUncertainty reason;
}

class CameraCoachFrameResult {
  const CameraCoachFrameResult({
    required this.kind,
    required this.session,
    this.pending,
    this.rep,
    this.decision,
  });

  final CameraCoachFrameKind kind;
  final LiveCoachSession session;
  final CameraCoachPendingConfirmation? pending;
  final TrainingRep? rep;
  final SessionDirectorDecision? decision;
}

class CameraCoachOrchestrator {

  LiveCoachSession _session;
  final DogVisionEngine _visionEngine;
  final int minFrameIntervalMs;
  final CameraEvidencePolicy evidencePolicy;
  final String Function(int repNumber) _makeRepId;
  final PostureBuffer _postureBuffer;
  final TemporalRepGate _repGate;

  int? _lastAnalysedFrameAtMs;
  bool _inFlight = false;
  CameraCoachPendingConfirmation? _pending;
  DogVisionResult? _lastVision;

  CameraCoachOrchestrator._({
    required this._session,
    required this._visionEngine,
    required this.minFrameIntervalMs,
    required this.evidencePolicy,
    required this._makeRepId,
    required this._postureBuffer,
    required this._repGate,
  });

  factory CameraCoachOrchestrator.withDefaults({
    required LiveCoachSession session,
    required DogVisionEngine visionEngine,
    int minFrameIntervalMs = 500,
    CameraEvidencePolicy evidencePolicy = const CameraEvidencePolicy(),
    String Function(int repNumber)? makeRepId,
  }) {
    return CameraCoachOrchestrator._(
      session: session,
      visionEngine: visionEngine,
      minFrameIntervalMs: minFrameIntervalMs < 0 ? 0 : minFrameIntervalMs,
      evidencePolicy: evidencePolicy,
      makeRepId:
          makeRepId ?? ((repNumber) => '${session.id}-rep-$repNumber'),
      postureBuffer: PostureBuffer(
        options: PostureBufferOptions(
          minConfidence: evidencePolicy.minPostureConfidence,
        ),
      ),
      repGate: TemporalRepGate(),
    );
  }

  LiveCoachSession getSession() => _session;

  CameraCoachPendingConfirmation? getPendingConfirmation() => _pending;

  DogVisionResult? getLastVisionResult() => _lastVision;

  Future<void> warmup() => _visionEngine.warmup();

  Future<void> dispose() async {
    _pending = null;
    _lastVision = null;
    _postureBuffer.reset();
    _repGate.reset();
    await _visionEngine.dispose();
  }

  LiveCoachSession stopByOwner() {
    _pending = null;
    _lastVision = null;
    _postureBuffer.reset();
    _repGate.reset();
    _session = stopLiveCoachSession(_session);
    return _session;
  }

  Future<CameraCoachFrameResult> processFrame(
    CameraFrame frame,
    CameraRepObservation observation,
  ) async {
    if (_session.status == LiveCoachSessionStatus.complete) {
      return CameraCoachFrameResult(
        kind: CameraCoachFrameKind.sessionComplete,
        session: _session,
      );
    }

    if (_inFlight) {
      return CameraCoachFrameResult(
        kind: CameraCoachFrameKind.busy,
        session: _session,
      );
    }

    final frameMs = DateTime.tryParse(frame.capturedAt)?.millisecondsSinceEpoch;
    if (frameMs != null &&
        _lastAnalysedFrameAtMs != null &&
        frameMs - _lastAnalysedFrameAtMs! < minFrameIntervalMs) {
      return CameraCoachFrameResult(
        kind: CameraCoachFrameKind.throttled,
        session: _session,
      );
    }

    _inFlight = true;
    try {
      final expected = observation.expectedPosture;
      final cueAt = observation.cueAt;
      if (expected != null && cueAt != null) {
        _repGate.beginCue(cueAt, expected);
      }

      final vision = await _visionEngine.detect(frame);
      _lastVision = vision;
      if (frameMs != null) _lastAnalysedFrameAtMs = frameMs;

      if (!vision.dogDetected) {
        _pending = null;
        return CameraCoachFrameResult(
          kind: CameraCoachFrameKind.dogNotInView,
          session: _session,
        );
      }

      if (cueAt == null) {
        _postureBuffer.push(
          PostureObservation(
            posture: vision.posture,
            confidence: vision.postureConfidence,
          ),
        );
        return CameraCoachFrameResult(
          kind: CameraCoachFrameKind.waitingForTemporal,
          session: _session,
        );
      }

      final rawDecision = decideCameraRepEvidence(
        vision,
        observation,
        policy: evidencePolicy,
      );
      if (rawDecision.kind == CameraEvidenceDecisionKind.askOwner &&
          rawDecision.reason != CameraEvidenceUncertainty.postureMismatch) {
        final pending = CameraCoachPendingConfirmation(
          vision: vision,
          observation: observation,
          reason: rawDecision.reason!,
        );
        _pending = pending;
        return CameraCoachFrameResult(
          kind: CameraCoachFrameKind.ownerConfirmation,
          session: _session,
          pending: pending,
        );
      }

      final temporal = _postureBuffer.push(
        PostureObservation(
          posture: vision.posture,
          confidence: vision.postureConfidence,
        ),
      );
      final stablePosture = temporal.stablePosture;
      if (stablePosture == null) {
        return CameraCoachFrameResult(
          kind: CameraCoachFrameKind.waitingForTemporal,
          session: _session,
        );
      }

      final stableVision = DogVisionResult(
        frameId: vision.frameId,
        analysedAt: vision.analysedAt,
        dogDetected: vision.dogDetected,
        detectionConfidence: vision.detectionConfidence,
        dogBoundingBox: vision.dogBoundingBox,
        detectionSource: vision.detectionSource,
        trackingConfidence: vision.trackingConfidence,
        trackingState: vision.trackingState,
        posture: stablePosture,
        postureConfidence: vision.postureConfidence,
        stressSignal: vision.stressSignal,
        stressConfidence: vision.stressConfidence,
      );

      if (expected != null) {
        final gate = _repGate.observe(stablePosture, expected);
        if (!gate.readyToScore && gate.waitingForTransition) {
          return CameraCoachFrameResult(
            kind: CameraCoachFrameKind.waitingForTransition,
            session: _session,
          );
        }
      }

      final decision = decideCameraRepEvidence(
        stableVision,
        observation,
        policy: evidencePolicy,
      );
      if (decision.kind == CameraEvidenceDecisionKind.askOwner) {
        final pending = CameraCoachPendingConfirmation(
          vision: stableVision,
          observation: observation,
          reason: decision.reason!,
        );
        _pending = pending;
        return CameraCoachFrameResult(
          kind: CameraCoachFrameKind.ownerConfirmation,
          session: _session,
          pending: pending,
        );
      }

      return _applyEvidence(decision.evidence!);
    } finally {
      _inFlight = false;
    }
  }

  CameraCoachFrameResult confirmPendingByOwner(
    TrainingOutcome outcome,
    String confirmedAt,
  ) {
    if (_session.status == LiveCoachSessionStatus.complete) {
      return CameraCoachFrameResult(
        kind: CameraCoachFrameKind.sessionComplete,
        session: _session,
      );
    }

    final pending = _pending;
    if (pending == null) {
      throw StateError('No camera observation is awaiting owner confirmation.');
    }

    final signal = pending.vision.stressSignal == VisionStressSignal.none
        ? pending.observation.signal
        : 'stress:${pending.vision.stressSignal.name}';

    final evidence = RepEvidence(
      source: EvidenceSource.ownerConfirmed,
      confidence: null,
      observedOutcome: outcome,
      observedAt: confirmedAt,
      cueAt: pending.observation.cueAt,
      responseAt: pending.observation.responseAt,
      markerAt: pending.observation.markerAt,
      rewardAt: pending.observation.rewardAt,
      cueCount: pending.observation.cueCount,
      signal: signal,
      posture: pending.vision.posture,
      poseConfidence: pending.vision.postureConfidence,
      notes: pending.observation.notes,
    );

    return _applyEvidence(evidence);
  }

  CameraCoachFrameResult _applyEvidence(RepEvidence evidence) {
    final repNumber = _session.reps.length + 1;
    final rep = TrainingRep(
      id: _makeRepId(repNumber),
      repNumber: repNumber,
      evidence: evidence,
    );
    final applied = applyRepToLiveSession(_session, rep);
    _session = applied.session;
    _pending = null;

    return CameraCoachFrameResult(
      kind: CameraCoachFrameKind.repRecorded,
      session: _session,
      rep: rep,
      decision: applied.decision,
    );
  }
}
