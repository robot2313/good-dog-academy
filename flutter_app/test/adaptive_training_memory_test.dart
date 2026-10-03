import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/adaptive_training/adaptive_training_memory.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

TrainingRepRecord _rep(
  int number,
  TrainingOutcome outcome, {
  int cueCount = 1,
  String responseAt = '2026-09-12T10:00:01.000Z',
  String? signal,
  EvidenceCorrectionRecord? correction,
}) {
  return TrainingRepRecord(
    id: 'rep-$number',
    repNumber: number,
    evidence: RepEvidenceRecord(
      source: TrainingEvidenceSource.cameraAuto,
      confidence: 0.84,
      observedOutcome: outcome,
      observedAt: '2026-09-12T10:00:00.000Z',
      cueAt: '2026-09-12T10:00:00.000Z',
      responseAt: responseAt,
      markerAt: null,
      rewardAt: null,
      cueCount: cueCount,
      signal: signal,
      posture: null,
      poseConfidence: null,
      notes: null,
    ),
    correction: correction,
  );
}

TrainingSessionRecord _session({
  String id = 's1',
  List<TrainingRepRecord>? reps,
  String completedAt = '2026-09-12T10:05:00.000Z',
  CameraCoachEndReason? endReason = CameraCoachEndReason.targetReached,
  bool endedEarly = false,
  TrainingDifficultyRecord endingDifficulty =
      const TrainingDifficultyRecord(
        distance: 1,
        duration: 2,
        distraction: 1,
      ),
}) {
  return TrainingSessionRecord(
    id: id,
    dogId: 'dog-1',
    lessonId: 'recall-short-distance',
    dailyPlanId: null,
    startedAt: '2026-09-12T10:00:00.000Z',
    completedAt: completedAt,
    durationMinutes: 5,
    outcome: TrainingOutcome.success,
    notes: 'Camera Coach',
    reps: reps ?? <TrainingRepRecord>[
      _rep(1, TrainingOutcome.success),
      _rep(2, TrainingOutcome.success),
    ],
    cameraCoach: CameraCoachSessionMetadataRecord(
      endedEarly: endedEarly,
      endReason: endReason,
      startingDifficulty: const TrainingDifficultyRecord(
        distance: 1,
        duration: 1,
        distraction: 1,
      ),
      endingDifficulty: endingDifficulty,
    ),
  );
}

void main() {
  test('owner-corrected outcomes drive clean-rep summaries', () {
    final corrected = EvidenceCorrectionRecord(
      correctedAt: '2026-09-12T10:00:02.000Z',
      correctedOutcome: TrainingOutcome.success,
      reason: 'Owner confirmed dog completed the rep',
    );
    final summary = summariseStoredCameraCoachSession(
      _session(
        reps: <TrainingRepRecord>[
          _rep(
            1,
            TrainingOutcome.unsuccessful,
            correction: corrected,
          ),
          _rep(2, TrainingOutcome.success),
        ],
      ),
      'recall',
    )!;

    expect(summary.cleanRepRate, 1);
    expect(summary.correctedRepRate, 0.5);
  });

  test('cue repetition, slow response and stress remain separate metrics', () {
    final summary = summariseStoredCameraCoachSession(
      _session(
        reps: <TrainingRepRecord>[
          _rep(1, TrainingOutcome.success, cueCount: 2),
          _rep(
            2,
            TrainingOutcome.partialSuccess,
            responseAt: '2026-09-12T10:00:05.000Z',
          ),
          _rep(
            3,
            TrainingOutcome.unsuccessful,
            signal: 'stress_signal',
          ),
        ],
      ),
      'recall',
    )!;

    expect(summary.repeatedCueRate, closeTo(1 / 3, 0.0001));
    expect(summary.slowResponseRate, closeTo(1 / 3, 0.0001));
    expect(summary.stressSignalRate, closeTo(1 / 3, 0.0001));
  });

  test('repeated sessions blend into long-term skill memory', () {
    final initial = emptyAdaptiveTrainingMemory('dog-1');
    final first = updateAdaptiveTrainingMemory(
      initial,
      AdaptiveSessionHistoryRecord(
        id: 's1',
        dogId: 'dog-1',
        lessonId: 'l1',
        skillId: 'recall',
        completedAt: '2026-09-10T10:00:00.000Z',
        totalReps: 4,
        cleanRepRate: 1,
        repeatedCueRate: 0,
        slowResponseRate: 0,
        stressSignalRate: 0,
        correctedRepRate: 0,
        endedEarly: false,
        endReason: CameraCoachEndReason.targetReached,
        startingDifficulty: const TrainingDifficultyRecord(
          distance: 1,
          duration: 1,
          distraction: 1,
        ),
        endingDifficulty: const TrainingDifficultyRecord(
          distance: 1,
          duration: 2,
          distraction: 1,
        ),
      ),
    );
    final second = updateAdaptiveTrainingMemory(
      first,
      AdaptiveSessionHistoryRecord(
        id: 's2',
        dogId: 'dog-1',
        lessonId: 'l1',
        skillId: 'recall',
        completedAt: '2026-09-12T10:00:00.000Z',
        totalReps: 4,
        cleanRepRate: 0.5,
        repeatedCueRate: 0.5,
        slowResponseRate: 0.25,
        stressSignalRate: 0,
        correctedRepRate: 0.25,
        endedEarly: false,
        endReason: CameraCoachEndReason.targetReached,
        startingDifficulty: const TrainingDifficultyRecord(
          distance: 1,
          duration: 2,
          distraction: 1,
        ),
        endingDifficulty: const TrainingDifficultyRecord(
          distance: 2,
          duration: 2,
          distraction: 1,
        ),
      ),
    );

    expect(second.totalSessions, 2);
    expect(second.skills['recall']!.sessionsCompleted, 2);
    expect(second.skills['recall']!.totalReps, 8);
    expect(second.skills['recall']!.cleanRepRate, 0.75);
    expect(second.skills['recall']!.repeatedCueRate, 0.25);
    expect(second.skills['recall']!.recommendedDifficulty.distance, 2);
  });

  test('snapshot rebuilds adaptive memory from persisted Camera Coach history', () {
    final snapshot = buildAdaptiveTrainingSnapshot(
      dogId: 'dog-1',
      sessions: <TrainingSessionRecord>[
        _session(
          id: 'older',
          completedAt: '2026-09-11T10:05:00.000Z',
        ),
        _session(
          id: 'newer',
          completedAt: '2026-09-12T10:05:00.000Z',
        ),
      ],
    );

    expect(snapshot.memory.totalSessions, 2);
    expect(snapshot.memory.skills['recall']!.sessionsCompleted, 2);
    expect(snapshot.history.map((item) => item.id), <String>['newer', 'older']);
  });
}
