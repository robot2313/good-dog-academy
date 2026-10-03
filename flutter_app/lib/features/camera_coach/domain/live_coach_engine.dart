import '../../lessons/session/training_session_record.dart';
import 'camera_coach_models.dart';

class DifficultyVector {
  const DifficultyVector({
    required this.distance,
    required this.duration,
    required this.distraction,
  });

  final int distance;
  final int duration;
  final int distraction;
}

enum LiveCoachSessionStatus { active, complete }

enum LiveCoachEndReason { targetReached, stress, fatigue, ownerStopped }

class EvidenceCorrection {
  const EvidenceCorrection({
    required this.correctedAt,
    required this.correctedOutcome,
    required this.reason,
  });

  final String correctedAt;
  final TrainingOutcome correctedOutcome;
  final String? reason;
}

class TrainingRep {
  const TrainingRep({
    required this.id,
    required this.repNumber,
    required this.evidence,
    this.correction,
  });

  final String id;
  final int repNumber;
  final RepEvidence evidence;
  final EvidenceCorrection? correction;
}

TrainingOutcome effectiveRepOutcome(TrainingRep rep) =>
    rep.correction?.correctedOutcome ?? rep.evidence.observedOutcome;

class LiveCoachSession {
  const LiveCoachSession({
    required this.id,
    required this.dogId,
    required this.lessonId,
    required this.targetReps,
    required this.reps,
    required this.startingDifficulty,
    required this.difficulty,
    required this.cleanSuccessStreak,
    required this.status,
    required this.endedEarly,
    required this.endReason,
  });

  final String id;
  final String dogId;
  final String lessonId;
  final int targetReps;
  final List<TrainingRep> reps;
  final DifficultyVector startingDifficulty;
  final DifficultyVector difficulty;
  final int cleanSuccessStreak;
  final LiveCoachSessionStatus status;
  final bool endedEarly;
  final LiveCoachEndReason? endReason;

  LiveCoachSession copyWith({
    List<TrainingRep>? reps,
    DifficultyVector? difficulty,
    int? cleanSuccessStreak,
    LiveCoachSessionStatus? status,
    bool? endedEarly,
    LiveCoachEndReason? endReason,
    bool clearEndReason = false,
  }) {
    return LiveCoachSession(
      id: id,
      dogId: dogId,
      lessonId: lessonId,
      targetReps: targetReps,
      reps: reps ?? this.reps,
      startingDifficulty: startingDifficulty,
      difficulty: difficulty ?? this.difficulty,
      cleanSuccessStreak: cleanSuccessStreak ?? this.cleanSuccessStreak,
      status: status ?? this.status,
      endedEarly: endedEarly ?? this.endedEarly,
      endReason: clearEndReason ? null : endReason ?? this.endReason,
    );
  }
}

enum SessionDirectorAction {
  repeat,
  hold,
  ease,
  progress,
  safetyBreak,
  finish,
}

class SessionDirectorDecision {
  const SessionDirectorDecision({
    required this.action,
    required this.headline,
    required this.reason,
    required this.instruction,
    required this.nextDifficulty,
  });

  final SessionDirectorAction action;
  final String headline;
  final String reason;
  final String instruction;
  final DifficultyVector nextDifficulty;
}

class AppliedRepResult {
  const AppliedRepResult({
    required this.session,
    required this.decision,
  });

  final LiveCoachSession session;
  final SessionDirectorDecision decision;
}

LiveCoachSession createLiveCoachSession({
  required String id,
  required String dogId,
  required String lessonId,
  int targetReps = 5,
  DifficultyVector startDifficulty = const DifficultyVector(
    distance: 1,
    duration: 1,
    distraction: 1,
  ),
}) {
  final start = normaliseDifficulty(startDifficulty);
  return LiveCoachSession(
    id: id,
    dogId: dogId,
    lessonId: lessonId,
    targetReps: targetReps < 1 ? 1 : targetReps,
    reps: const <TrainingRep>[],
    startingDifficulty: start,
    difficulty: start,
    cleanSuccessStreak: 0,
    status: LiveCoachSessionStatus.active,
    endedEarly: false,
    endReason: null,
  );
}

DifficultyVector normaliseDifficulty(DifficultyVector value) => DifficultyVector(
  distance: _clampDifficulty(value.distance),
  duration: _clampDifficulty(value.duration),
  distraction: _clampDifficulty(value.distraction),
);

SessionDirectorDecision autonomousSessionDirector(LiveCoachSession session) {
  final current = normaliseDifficulty(session.difficulty);
  final total = session.reps.length;

  if (session.status == LiveCoachSessionStatus.complete) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.finish,
      headline: 'Session complete',
      reason: 'This session has already been closed.',
      instruction: 'Save the session evidence and finish on a calm note.',
      nextDifficulty: current,
    );
  }

  if (_recentStressCount(session) >= 1) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.safetyBreak,
      headline: 'Reduce pressure',
      reason: 'A recent rep contains possible stress or discomfort evidence.',
      instruction:
          'Pause, give the dog more space, and only continue if the dog settles comfortably.',
      nextDifficulty: _easier(current),
    );
  }

  if (total >= session.targetReps) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.finish,
      headline: 'Session complete',
      reason: 'The planned rep target has been reached.',
      instruction: 'Finish on a calm note and save the session evidence.',
      nextDifficulty: current,
    );
  }

  if (_recentFailureCount(session) >= 2) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.ease,
      headline: 'Make the next rep easier',
      reason: 'Two or more of the most recent reps were not clean successes.',
      instruction:
          'Reduce one challenge variable and run the same skill again.',
      nextDifficulty: _easier(current),
    );
  }

  if (session.cleanSuccessStreak >= 2) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.progress,
      headline: 'Ready for a small progression',
      reason: 'The dog has produced consecutive clean successful reps.',
      instruction:
          'Increase only one challenge variable for the next rep.',
      nextDifficulty: _harder(current),
    );
  }

  if (total == 0) {
    return SessionDirectorDecision(
      action: SessionDirectorAction.repeat,
      headline: 'Run the first rep',
      reason: 'No evidence has been collected yet.',
      instruction: 'Use the planned setup and score the first response.',
      nextDifficulty: current,
    );
  }

  return SessionDirectorDecision(
    action: SessionDirectorAction.hold,
    headline: 'Hold this setup',
    reason:
        'The evidence is not strong enough to justify making the exercise harder or easier yet.',
    instruction:
        'Repeat at the same difficulty and collect another clean data point.',
    nextDifficulty: current,
  );
}

AppliedRepResult applyRepToLiveSession(
  LiveCoachSession session,
  TrainingRep rep,
) {
  if (session.status == LiveCoachSessionStatus.complete) {
    return AppliedRepResult(
      session: session,
      decision: autonomousSessionDirector(session),
    );
  }

  final reps = <TrainingRep>[...session.reps, rep];
  final clean = effectiveRepOutcome(rep) == TrainingOutcome.success &&
      !_repHasStressSignal(rep);
  final provisional = session.copyWith(
    reps: List.unmodifiable(reps),
    cleanSuccessStreak: clean ? session.cleanSuccessStreak + 1 : 0,
  );
  final decision = autonomousSessionDirector(provisional);
  final reachedTarget = reps.length >= session.targetReps;
  final repeatedStress = _recentStressCount(provisional) >= 2;
  final safetyBreak = decision.action == SessionDirectorAction.safetyBreak;
  final normalTargetReached = reachedTarget && !safetyBreak;

  return AppliedRepResult(
    decision: decision,
    session: provisional.copyWith(
      difficulty: decision.nextDifficulty,
      status: repeatedStress || normalTargetReached
          ? LiveCoachSessionStatus.complete
          : LiveCoachSessionStatus.active,
      endedEarly: repeatedStress,
      endReason: repeatedStress
          ? LiveCoachEndReason.stress
          : normalTargetReached
          ? LiveCoachEndReason.targetReached
          : null,
      clearEndReason: !repeatedStress && !normalTargetReached,
    ),
  );
}

LiveCoachSession stopLiveCoachSession(LiveCoachSession session) {
  if (session.status == LiveCoachSessionStatus.complete) return session;
  return session.copyWith(
    status: LiveCoachSessionStatus.complete,
    endedEarly: true,
    endReason: LiveCoachEndReason.ownerStopped,
  );
}

bool _repHasStressSignal(TrainingRep rep) {
  final signal = (rep.evidence.signal ?? '').toLowerCase();
  final notes = (rep.evidence.notes ?? '').toLowerCase();
  return signal.contains('stress') ||
      signal.contains('discomfort') ||
      notes.contains('stress') ||
      notes.contains('discomfort');
}

int _recentFailureCount(LiveCoachSession session, {int take = 3}) {
  final start = session.reps.length > take ? session.reps.length - take : 0;
  return session.reps
      .sublist(start)
      .where((rep) => effectiveRepOutcome(rep) != TrainingOutcome.success)
      .length;
}

int _recentStressCount(LiveCoachSession session, {int take = 3}) {
  final start = session.reps.length > take ? session.reps.length - take : 0;
  return session.reps.sublist(start).where(_repHasStressSignal).length;
}

DifficultyVector _easier(DifficultyVector value) {
  if (value.distraction > 1) {
    return DifficultyVector(
      distance: value.distance,
      duration: value.duration,
      distraction: value.distraction - 1,
    );
  }
  if (value.distance > 1) {
    return DifficultyVector(
      distance: value.distance - 1,
      duration: value.duration,
      distraction: value.distraction,
    );
  }
  if (value.duration > 1) {
    return DifficultyVector(
      distance: value.distance,
      duration: value.duration - 1,
      distraction: value.distraction,
    );
  }
  return value;
}

DifficultyVector _harder(DifficultyVector value) {
  if (value.duration < 5) {
    return DifficultyVector(
      distance: value.distance,
      duration: value.duration + 1,
      distraction: value.distraction,
    );
  }
  if (value.distance < 5) {
    return DifficultyVector(
      distance: value.distance + 1,
      duration: value.duration,
      distraction: value.distraction,
    );
  }
  if (value.distraction < 5) {
    return DifficultyVector(
      distance: value.distance,
      duration: value.duration,
      distraction: value.distraction + 1,
    );
  }
  return value;
}

int _clampDifficulty(int value) {
  if (value < 1) return 1;
  if (value > 5) return 5;
  return value;
}
