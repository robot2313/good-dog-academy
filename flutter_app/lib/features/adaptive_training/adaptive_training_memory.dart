import '../lessons/data/production_lessons.dart';
import '../lessons/session/training_session_record.dart';

class SkillTrainingMemory {
  const SkillTrainingMemory({
    required this.skillId,
    required this.sessionsCompleted,
    required this.totalReps,
    required this.cleanRepRate,
    required this.repeatedCueRate,
    required this.slowResponseRate,
    required this.stressSignalRate,
    required this.correctedRepRate,
    required this.lastTrainedAt,
    required this.lastEndedEarly,
    required this.lastEndReason,
    required this.recommendedDifficulty,
  });

  final String skillId;
  final int sessionsCompleted;
  final int totalReps;
  final double cleanRepRate;
  final double repeatedCueRate;
  final double slowResponseRate;
  final double stressSignalRate;
  final double correctedRepRate;
  final String lastTrainedAt;
  final bool lastEndedEarly;
  final CameraCoachEndReason? lastEndReason;
  final TrainingDifficultyRecord recommendedDifficulty;
}

class AdaptiveTrainingMemory {
  const AdaptiveTrainingMemory({
    required this.schemaVersion,
    required this.dogId,
    required this.totalSessions,
    required this.skills,
    required this.updatedAt,
  });

  final int schemaVersion;
  final String dogId;
  final int totalSessions;
  final Map<String, SkillTrainingMemory> skills;
  final String updatedAt;
}

class AdaptiveSessionHistoryRecord {
  const AdaptiveSessionHistoryRecord({
    required this.id,
    required this.dogId,
    required this.lessonId,
    required this.skillId,
    required this.completedAt,
    required this.totalReps,
    required this.cleanRepRate,
    required this.repeatedCueRate,
    required this.slowResponseRate,
    required this.stressSignalRate,
    required this.correctedRepRate,
    required this.endedEarly,
    required this.endReason,
    required this.startingDifficulty,
    required this.endingDifficulty,
  });

  final String id;
  final String dogId;
  final String lessonId;
  final String skillId;
  final String completedAt;
  final int totalReps;
  final double cleanRepRate;
  final double repeatedCueRate;
  final double slowResponseRate;
  final double stressSignalRate;
  final double correctedRepRate;
  final bool endedEarly;
  final CameraCoachEndReason? endReason;
  final TrainingDifficultyRecord startingDifficulty;
  final TrainingDifficultyRecord endingDifficulty;
}

class AdaptiveTrainingSnapshot {
  const AdaptiveTrainingSnapshot({
    required this.memory,
    required this.history,
  });

  final AdaptiveTrainingMemory memory;
  final List<AdaptiveSessionHistoryRecord> history;
}

AdaptiveTrainingMemory emptyAdaptiveTrainingMemory(String dogId) {
  return AdaptiveTrainingMemory(
    schemaVersion: 1,
    dogId: dogId,
    totalSessions: 0,
    skills: const <String, SkillTrainingMemory>{},
    updatedAt: DateTime.fromMillisecondsSinceEpoch(
      0,
      isUtc: true,
    ).toIso8601String(),
  );
}

AdaptiveSessionHistoryRecord? summariseStoredCameraCoachSession(
  TrainingSessionRecord session,
  String skillId,
) {
  final metadata = session.cameraCoach;
  final completedAt = session.completedAt;
  if (metadata == null ||
      completedAt == null ||
      session.reps.isEmpty ||
      skillId.trim().isEmpty) {
    return null;
  }

  final total = session.reps.isEmpty ? 1 : session.reps.length;
  final clean = session.reps.where((rep) {
    return _effectiveOutcome(rep) == TrainingOutcome.success &&
        !_hasStress(rep.evidence.signal, rep.evidence.notes);
  }).length;
  final repeated = session.reps.where((rep) {
    return (rep.evidence.cueCount ?? 1) >= 2;
  }).length;
  final slow = session.reps.where((rep) {
    final cueAt = rep.evidence.cueAt;
    final responseAt = rep.evidence.responseAt;
    if (cueAt == null || responseAt == null) return false;
    final cue = DateTime.tryParse(cueAt);
    final response = DateTime.tryParse(responseAt);
    if (cue == null || response == null) return false;
    return response.difference(cue).inMilliseconds >= 4000;
  }).length;
  final stress = session.reps.where((rep) {
    return _hasStress(rep.evidence.signal, rep.evidence.notes);
  }).length;
  final corrected = session.reps.where((rep) => rep.correction != null).length;

  return AdaptiveSessionHistoryRecord(
    id: session.id,
    dogId: session.dogId,
    lessonId: session.lessonId,
    skillId: skillId,
    completedAt: completedAt,
    totalReps: session.reps.length,
    cleanRepRate: clean / total,
    repeatedCueRate: repeated / total,
    slowResponseRate: slow / total,
    stressSignalRate: stress / total,
    correctedRepRate: corrected / total,
    endedEarly: metadata.endedEarly,
    endReason: metadata.endReason,
    startingDifficulty: metadata.startingDifficulty,
    endingDifficulty: metadata.endingDifficulty,
  );
}

AdaptiveTrainingMemory updateAdaptiveTrainingMemory(
  AdaptiveTrainingMemory memory,
  AdaptiveSessionHistoryRecord record,
) {
  final previous = memory.skills[record.skillId];
  final sessions = (previous?.sessionsCompleted ?? 0) + 1;

  double blend(double? oldValue, double next) {
    if (oldValue == null) return next;
    return (oldValue * (sessions - 1) + next) / sessions;
  }

  final skill = SkillTrainingMemory(
    skillId: record.skillId,
    sessionsCompleted: sessions,
    totalReps: (previous?.totalReps ?? 0) + record.totalReps,
    cleanRepRate: blend(previous?.cleanRepRate, record.cleanRepRate),
    repeatedCueRate: blend(
      previous?.repeatedCueRate,
      record.repeatedCueRate,
    ),
    slowResponseRate: blend(
      previous?.slowResponseRate,
      record.slowResponseRate,
    ),
    stressSignalRate: blend(
      previous?.stressSignalRate,
      record.stressSignalRate,
    ),
    correctedRepRate: blend(
      previous?.correctedRepRate,
      record.correctedRepRate,
    ),
    lastTrainedAt: record.completedAt,
    lastEndedEarly: record.endedEarly,
    lastEndReason: record.endReason,
    recommendedDifficulty: record.endingDifficulty,
  );

  return AdaptiveTrainingMemory(
    schemaVersion: 1,
    dogId: record.dogId,
    totalSessions: memory.totalSessions + 1,
    skills: <String, SkillTrainingMemory>{
      ...memory.skills,
      record.skillId: skill,
    },
    updatedAt: record.completedAt,
  );
}

AdaptiveTrainingSnapshot buildAdaptiveTrainingSnapshot({
  required String dogId,
  required Iterable<TrainingSessionRecord> sessions,
}) {
  final skillByLesson = <String, String>{
    for (final lesson in productionLessons) lesson.id: lesson.skill,
  };

  final history = <AdaptiveSessionHistoryRecord>[];
  for (final session in sessions) {
    if (session.dogId != dogId) continue;
    final skill = skillByLesson[session.lessonId];
    if (skill == null) continue;
    final summary = summariseStoredCameraCoachSession(session, skill);
    if (summary != null) history.add(summary);
  }

  history.sort((a, b) => a.completedAt.compareTo(b.completedAt));
  var memory = emptyAdaptiveTrainingMemory(dogId);
  for (final record in history) {
    memory = updateAdaptiveTrainingMemory(memory, record);
  }

  final newestFirst = [...history]
    ..sort((a, b) => b.completedAt.compareTo(a.completedAt));
  return AdaptiveTrainingSnapshot(
    memory: memory,
    history: List.unmodifiable(newestFirst),
  );
}

TrainingOutcome _effectiveOutcome(TrainingRepRecord rep) {
  return rep.correction?.correctedOutcome ?? rep.evidence.observedOutcome;
}

bool _hasStress(String? signal, String? notes) {
  final text = '${signal ?? ''} ${notes ?? ''}'.toLowerCase();
  return text.contains('stress') || text.contains('discomfort');
}
