import 'package:flutter_test/flutter_test.dart';
import 'package:good_dog_academy/features/adaptive_training/adaptive_lesson_switch.dart';
import 'package:good_dog_academy/features/adaptive_training/adaptive_training_memory.dart';
import 'package:good_dog_academy/features/lessons/session/training_session_record.dart';

const current = AdaptiveLessonCandidate(
  lessonId: 'recall-advanced',
  skillId: 'recall',
  difficultyLevel: 4,
);
const easier = AdaptiveLessonCandidate(
  lessonId: 'recall-foundation',
  skillId: 'recall',
  difficultyLevel: 2,
);

AdaptiveTrainingMemory _memory({
  double cleanRepRate = 0.75,
  double repeatedCueRate = 0.1,
  double slowResponseRate = 0.1,
}) {
  return AdaptiveTrainingMemory(
    schemaVersion: 1,
    dogId: 'dog-1',
    totalSessions: 4,
    updatedAt: '2026-09-12T12:00:00.000Z',
    skills: <String, SkillTrainingMemory>{
      'recall': SkillTrainingMemory(
        skillId: 'recall',
        sessionsCompleted: 4,
        totalReps: 20,
        cleanRepRate: cleanRepRate,
        repeatedCueRate: repeatedCueRate,
        slowResponseRate: slowResponseRate,
        stressSignalRate: 0,
        correctedRepRate: 0,
        lastTrainedAt: '2026-09-12T12:00:00.000Z',
        lastEndedEarly: false,
        lastEndReason: CameraCoachEndReason.targetReached,
        recommendedDifficulty: const TrainingDifficultyRecord(
          distance: 3,
          duration: 2,
          distraction: 2,
        ),
      ),
    },
  );
}

List<AdaptiveSessionHistoryRecord> _history({
  double cleanRepRate = 0.8,
  double stressSignalRate = 0,
  CameraCoachEndReason? endReason = CameraCoachEndReason.targetReached,
}) {
  AdaptiveSessionHistoryRecord record(String id, String completedAt) {
    return AdaptiveSessionHistoryRecord(
      id: id,
      dogId: 'dog-1',
      lessonId: current.lessonId,
      skillId: 'recall',
      completedAt: completedAt,
      totalReps: 5,
      cleanRepRate: cleanRepRate,
      repeatedCueRate: 0.1,
      slowResponseRate: 0.1,
      stressSignalRate: stressSignalRate,
      correctedRepRate: 0,
      endedEarly: endReason == CameraCoachEndReason.stress,
      endReason: endReason,
      startingDifficulty: const TrainingDifficultyRecord(
        distance: 3,
        duration: 2,
        distraction: 2,
      ),
      endingDifficulty: const TrainingDifficultyRecord(
        distance: 3,
        duration: 2,
        distraction: 2,
      ),
    );
  }

  return <AdaptiveSessionHistoryRecord>[
    record('s1', '2026-09-12T12:00:00.000Z'),
    record('s2', '2026-09-11T12:00:00.000Z'),
  ];
}

void main() {
  test('stress evidence switches to an easier same-skill lesson', () {
    final result = decideAdaptiveLessonSwitch(
      current: current,
      candidates: const <AdaptiveLessonCandidate>[current, easier],
      memory: _memory(),
      history: _history(
        stressSignalRate: 0.4,
        endReason: CameraCoachEndReason.stress,
      ),
    );

    expect(result.action, AdaptiveLessonSwitchAction.switchLesson);
    expect(result.lessonId, easier.lessonId);
    expect(result.reason, LessonSwitchReason.safetyOverride);
  });

  test('persistently low clean performance steps down', () {
    final result = decideAdaptiveLessonSwitch(
      current: current,
      candidates: const <AdaptiveLessonCandidate>[current, easier],
      memory: _memory(cleanRepRate: 0.5),
      history: _history(cleanRepRate: 0.45),
    );

    expect(result.lessonId, easier.lessonId);
    expect(result.reason, LessonSwitchReason.decliningPerformance);
  });

  test('high repeated-cue rate steps down after enough history', () {
    final result = decideAdaptiveLessonSwitch(
      current: current,
      candidates: const <AdaptiveLessonCandidate>[current, easier],
      memory: _memory(repeatedCueRate: 0.45),
      history: _history(),
    );

    expect(result.lessonId, easier.lessonId);
    expect(result.reason, LessonSwitchReason.cueRepetition);
  });

  test('healthy evidence keeps the current lesson', () {
    final result = decideAdaptiveLessonSwitch(
      current: current,
      candidates: const <AdaptiveLessonCandidate>[current, easier],
      memory: _memory(),
      history: _history(),
    );

    expect(result.action, AdaptiveLessonSwitchAction.stay);
    expect(result.lessonId, current.lessonId);
    expect(result.reason, LessonSwitchReason.stayCurrent);
  });

  test('one recent session is not enough evidence to switch', () {
    final result = decideAdaptiveLessonSwitch(
      current: current,
      candidates: const <AdaptiveLessonCandidate>[current, easier],
      memory: _memory(),
      history: _history().take(1).toList(),
    );

    expect(result.reason, LessonSwitchReason.insufficientEvidence);
  });
}
