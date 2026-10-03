import '../../lessons/progress/lesson_progress_controller.dart';
import '../../lessons/session/training_session_record.dart';
import '../domain/camera_coach_models.dart';
import '../domain/camera_coach_qa_lessons.dart';
import '../domain/live_coach_engine.dart';

class CameraCoachPersistenceResult {
  const CameraCoachPersistenceResult({
    required this.sessionId,
    required this.outcome,
    required this.rating,
    required this.repCount,
  });

  final String sessionId;
  final TrainingOutcome outcome;
  final int rating;
  final int repCount;
}

class CameraCoachSessionPersistenceException implements Exception {
  const CameraCoachSessionPersistenceException(this.message);

  final String message;

  @override
  String toString() => 'CameraCoachSessionPersistenceException: $message';
}

abstract interface class CameraCoachSessionPersister {
  Future<CameraCoachPersistenceResult> persistCompletedSession({
    required String ownerId,
    required String dogId,
    required LiveCoachSession session,
    required String startedAt,
    String? dailyPlanId,
    DateTime? completedAt,
    String notes,
    bool allowPrerequisiteBypass,
  });
}

class CameraCoachSessionPersistenceService
    implements CameraCoachSessionPersister {
  const CameraCoachSessionPersistenceService({
    required this.progressController,
  });

  final LessonProgressController progressController;

  Future<CameraCoachPersistenceResult> persistCompletedSession({
    required String ownerId,
    required String dogId,
    required LiveCoachSession session,
    required String startedAt,
    String? dailyPlanId,
    DateTime? completedAt,
    String notes = 'Completed with Camera Coach.',
    bool allowPrerequisiteBypass = false,
  }) async {
    if (session.status != LiveCoachSessionStatus.complete) {
      throw const CameraCoachSessionPersistenceException(
        'Only completed Camera Coach sessions can be persisted.',
      );
    }
    if (isCameraCoachQaLessonId(session.lessonId)) {
      throw const CameraCoachSessionPersistenceException(
        'Camera Coach QA sessions must not change production training history.',
      );
    }
    if (session.dogId != dogId) {
      throw const CameraCoachSessionPersistenceException(
        'Camera Coach session belongs to a different dog.',
      );
    }
    if (session.reps.isEmpty) {
      throw const CameraCoachSessionPersistenceException(
        'A Camera Coach session with no scored reps is not training history.',
      );
    }

    final start = DateTime.tryParse(startedAt)?.toUtc();
    if (start == null) {
      throw const CameraCoachSessionPersistenceException(
        'Camera Coach session start time is invalid.',
      );
    }
    final end = (completedAt ?? DateTime.now()).toUtc();
    if (end.isBefore(start)) {
      throw const CameraCoachSessionPersistenceException(
        'Camera Coach session completion time is invalid.',
      );
    }

    final outcome = overallCameraCoachOutcome(session);
    final rating = switch (outcome) {
      TrainingOutcome.success => 5,
      TrainingOutcome.partialSuccess => 3,
      TrainingOutcome.unsuccessful => 2,
    };
    final reps = session.reps.map(_toStoredRep).toList(growable: false);

    await progressController.recordLessonAttempt(
      ownerId: ownerId,
      dogId: dogId,
      lessonId: session.lessonId,
      rating: rating,
      attemptedAt: end.toIso8601String(),
      startedAt: start.toIso8601String(),
      sessionId: session.id,
      dailyPlanId: dailyPlanId,
      notes: notes,
      reps: reps,
      cameraCoach: CameraCoachSessionMetadataRecord(
        endedEarly: session.endedEarly,
        endReason: _storedEndReason(session.endReason),
        startingDifficulty: _storedDifficulty(session.startingDifficulty),
        endingDifficulty: _storedDifficulty(session.difficulty),
      ),
      allowPrerequisiteBypass: allowPrerequisiteBypass,
    );

    return CameraCoachPersistenceResult(
      sessionId: session.id,
      outcome: outcome,
      rating: rating,
      repCount: reps.length,
    );
  }
}

TrainingOutcome overallCameraCoachOutcome(LiveCoachSession session) {
  if (session.reps.isEmpty) {
    throw const CameraCoachSessionPersistenceException(
      'Cannot derive a Camera Coach outcome without reps.',
    );
  }

  final outcomes = session.reps.map(effectiveRepOutcome).toList(growable: false);
  final successes = outcomes
      .where((outcome) => outcome == TrainingOutcome.success)
      .length;
  final partials = outcomes
      .where((outcome) => outcome == TrainingOutcome.partialSuccess)
      .length;

  if (successes / outcomes.length >= 0.75 && !session.endedEarly) {
    return TrainingOutcome.success;
  }
  if (successes + partials > 0) {
    return TrainingOutcome.partialSuccess;
  }
  return TrainingOutcome.unsuccessful;
}

TrainingRepRecord _toStoredRep(TrainingRep rep) {
  final evidence = rep.evidence;
  final correction = rep.correction;
  return TrainingRepRecord(
    id: rep.id,
    repNumber: rep.repNumber,
    evidence: RepEvidenceRecord(
      source: _storedSource(evidence.source),
      confidence: evidence.confidence,
      observedOutcome: evidence.observedOutcome,
      observedAt: evidence.observedAt,
      cueAt: evidence.cueAt,
      responseAt: evidence.responseAt,
      markerAt: evidence.markerAt,
      rewardAt: evidence.rewardAt,
      cueCount: evidence.cueCount,
      signal: evidence.signal,
      posture: _storedPosture(evidence.posture),
      poseConfidence: evidence.poseConfidence,
      notes: evidence.notes,
    ),
    correction: correction == null
        ? null
        : EvidenceCorrectionRecord(
            correctedAt: correction.correctedAt,
            correctedOutcome: correction.correctedOutcome,
            reason: correction.reason,
          ),
  );
}

TrainingEvidenceSource _storedSource(EvidenceSource source) {
  switch (source) {
    case EvidenceSource.ownerConfirmed:
      return TrainingEvidenceSource.ownerConfirmed;
    case EvidenceSource.cameraAuto:
      return TrainingEvidenceSource.cameraAuto;
    case EvidenceSource.voiceAuto:
      return TrainingEvidenceSource.voiceAuto;
    case EvidenceSource.multimodalAuto:
      return TrainingEvidenceSource.multimodalAuto;
  }
}

StoredDogPosture? _storedPosture(DogPosture? posture) {
  switch (posture) {
    case DogPosture.standLike:
      return StoredDogPosture.standLike;
    case DogPosture.sitLike:
      return StoredDogPosture.sitLike;
    case DogPosture.downLike:
      return StoredDogPosture.downLike;
    case null:
      return null;
  }
}


TrainingDifficultyRecord _storedDifficulty(DifficultyVector difficulty) {
  return TrainingDifficultyRecord(
    distance: difficulty.distance,
    duration: difficulty.duration,
    distraction: difficulty.distraction,
  );
}

CameraCoachEndReason? _storedEndReason(LiveCoachEndReason? reason) {
  switch (reason) {
    case LiveCoachEndReason.targetReached:
      return CameraCoachEndReason.targetReached;
    case LiveCoachEndReason.stress:
      return CameraCoachEndReason.stress;
    case LiveCoachEndReason.fatigue:
      return CameraCoachEndReason.fatigue;
    case LiveCoachEndReason.ownerStopped:
      return CameraCoachEndReason.ownerStopped;
    case null:
      return null;
  }
}
