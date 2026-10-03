import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/camera_coach/domain/camera_coach_models.dart';
import 'package:good_dog_academy/features/camera_coach/domain/live_coach_engine.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

TrainingRep _rep(
  int number, {
  TrainingOutcome outcome = TrainingOutcome.success,
  String? signal,
}) => TrainingRep(
  id: 'rep-$number',
  repNumber: number,
  evidence: RepEvidence(
    source: EvidenceSource.ownerConfirmed,
    confidence: 1,
    observedOutcome: outcome,
    observedAt: '2026-10-04T00:00:0$number.000Z',
    cueAt: '2026-10-04T00:00:00.000Z',
    responseAt: '2026-10-04T00:00:01.000Z',
    markerAt: null,
    rewardAt: null,
    cueCount: 1,
    signal: signal,
    posture: null,
    poseConfidence: null,
    notes: null,
  ),
);

void main() {
  test('two clean successes progress exactly one variable', () {
    var session = createLiveCoachSession(
      id: 's1',
      dogId: 'dog-1',
      lessonId: 'sit',
    );
    session = applyRepToLiveSession(session, _rep(1)).session;
    session = applyRepToLiveSession(session, _rep(2)).session;

    final decision = autonomousSessionDirector(session);
    expect(decision.action, SessionDirectorAction.progress);
    expect(decision.nextDifficulty.duration, 2);
    expect(decision.nextDifficulty.distance, 1);
    expect(decision.nextDifficulty.distraction, 1);
  });

  test('repeated unsuccessful reps make the next rep easier', () {
    var session = createLiveCoachSession(
      id: 's2',
      dogId: 'dog-1',
      lessonId: 'sit',
      startDifficulty: const DifficultyVector(
        distance: 2,
        duration: 2,
        distraction: 2,
      ),
    );
    session = applyRepToLiveSession(
      session,
      _rep(1, outcome: TrainingOutcome.unsuccessful),
    ).session;
    session = applyRepToLiveSession(
      session,
      _rep(2, outcome: TrainingOutcome.unsuccessful),
    ).session;

    final decision = autonomousSessionDirector(session);
    expect(decision.action, SessionDirectorAction.ease);
    expect(decision.nextDifficulty.distraction, 1);
  });

  test('stress evidence outranks success and repeated stress ends early', () {
    var session = createLiveCoachSession(
      id: 's3',
      dogId: 'dog-1',
      lessonId: 'sit',
    );
    session = applyRepToLiveSession(
      session,
      _rep(1, signal: 'stress:avoidanceLike'),
    ).session;
    expect(
      autonomousSessionDirector(session).action,
      SessionDirectorAction.safetyBreak,
    );

    session = applyRepToLiveSession(
      session,
      _rep(2, signal: 'stress:avoidanceLike'),
    ).session;

    expect(session.status, LiveCoachSessionStatus.complete);
    expect(session.endedEarly, isTrue);
    expect(session.endReason, LiveCoachEndReason.stress);
  });

  test('stress on final planned rep does not falsely complete target', () {
    var session = createLiveCoachSession(
      id: 's4',
      dogId: 'dog-1',
      lessonId: 'sit',
      targetReps: 2,
    );
    session = applyRepToLiveSession(session, _rep(1)).session;
    session = applyRepToLiveSession(
      session,
      _rep(2, signal: 'stress:avoidanceLike'),
    ).session;

    expect(session.status, LiveCoachSessionStatus.active);
    expect(session.endReason, isNull);
    expect(
      autonomousSessionDirector(session).action,
      SessionDirectorAction.safetyBreak,
    );
  });
}
