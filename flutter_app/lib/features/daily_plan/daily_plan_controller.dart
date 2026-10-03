import 'dart:async';

import 'package:flutter/widgets.dart';

import '../assessment/assessment_controller.dart';
import '../assessment/assessment_models.dart';
import '../identity/app_identity_controller.dart';
import '../identity/app_identity_record.dart';
import '../lessons/progress/lesson_progress_controller.dart';
import '../lessons/progress/lesson_progress_record.dart';
import '../lessons/session/training_session_record.dart';
import 'daily_plan_generation_service.dart';
import 'daily_plan_models.dart';
import 'daily_plan_repository.dart';

class DailyPlanController extends ChangeNotifier {
  DailyPlanController({required this.repository});

  final DailyPlanRepository repository;
  bool loading = false;
  Object? error;
  DailyPlanRecord? plan;
  String? ownerId;
  String? dogId;
  int _generation = 0;
  bool _disposed = false;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  void clear() {
    _generation++;
    ownerId = null;
    dogId = null;
    plan = null;
    error = null;
    loading = false;
    _notify();
  }

  Future<void> sync({
    required AppOwnerRecord owner,
    required AppDogRecord dog,
    required BehaviourProfileRecord profile,
    required BehaviourAssessmentRecord assessment,
    required List<LessonProgressRecord> progressRecords,
    required List<TrainingSessionRecord> sessions,
    DateTime? now,
  }) async {
    final generation = ++_generation;
    ownerId = owner.id;
    dogId = dog.id;
    loading = true;
    error = null;
    _notify();

    try {
      final effectiveNow = now ?? DateTime.now();
      final result = await DailyPlanGenerationService(
        repository: repository,
      ).getOrCreate(
        owner: owner,
        dog: dog,
        profile: profile,
        assessment: assessment,
        progress: progressRecords,
        now: effectiveNow,
      );
      final reconciled = await _reconcileCompletion(
        result,
        sessions,
        effectiveNow,
      );
      if (_disposed ||
          generation != _generation ||
          ownerId != owner.id ||
          dogId != dog.id) {
        return;
      }
      plan = reconciled;
    } catch (cause) {
      if (!_disposed && generation == _generation) {
        error = cause;
        plan = null;
      }
    } finally {
      if (!_disposed && generation == _generation) {
        loading = false;
        _notify();
      }
    }
  }

  Future<DailyPlanRecord> _reconcileCompletion(
    DailyPlanRecord current,
    List<TrainingSessionRecord> sessions,
    DateTime now,
  ) async {
    if (current.status != 'planned') return current;

    final coveredLessonIds = sessions
        .where(
          (session) =>
              session.dogId == current.dogId &&
              session.dailyPlanId == current.id &&
              session.completedAt != null,
        )
        .map((session) => session.lessonId)
        .toSet();

    if (!current.items.every(
      (item) => coveredLessonIds.contains(item.lessonId),
    )) {
      return current;
    }

    final updated = DailyPlanRecord(
      id: current.id,
      ownerId: current.ownerId,
      dogId: current.dogId,
      localDate: current.localDate,
      timezone: current.timezone,
      targetMinutes: current.targetMinutes,
      estimatedMinutes: current.estimatedMinutes,
      focusSkill: current.focusSkill,
      items: current.items,
      status: 'completed',
      sourceAssessmentId: current.sourceAssessmentId,
      generatedAt: current.generatedAt,
      createdAt: current.createdAt,
      updatedAt: now.toUtc().toIso8601String(),
    );
    await repository.save(updated);
    return updated;
  }

  @override
  void dispose() {
    _disposed = true;
    _generation++;
    super.dispose();
  }
}

class DailyPlanBinding {
  DailyPlanBinding({
    required this.identity,
    required this.assessment,
    required this.progress,
    required this.dailyPlan,
  }) {
    identity.addListener(_bind);
    assessment.addListener(_bind);
    progress.addListener(_bind);
    _bind();
  }

  final AppIdentityController identity;
  final AssessmentController assessment;
  final LessonProgressController progress;
  final DailyPlanController dailyPlan;
  String? _fingerprint;

  void _bind() {
    final owner = identity.loaded && !identity.loading ? identity.owner : null;
    final dog = identity.loaded && !identity.loading
        ? identity.selectedDog
        : null;

    if (owner == null || dog == null) {
      _fingerprint = null;
      dailyPlan.clear();
      return;
    }

    if (!assessment.loaded ||
        assessment.loading ||
        !assessment.completed ||
        assessment.dogId != dog.id ||
        assessment.profile == null ||
        assessment.assessment == null ||
        progress.loading ||
        progress.error != null ||
        progress.ownerId != owner.id ||
        progress.dogId != dog.id) {
      return;
    }

    final progressFingerprint = progress.records
        .map((record) => '${record.id}:${record.updatedAt}')
        .join('|');
    final sessionFingerprint = progress.sessions
        .map(
          (session) =>
              '${session.id}:${session.dailyPlanId}:${session.completedAt}',
        )
        .join('|');
    final fingerprint =
        '${owner.id}:${dog.id}:${assessment.assessment!.id}:'
        '$progressFingerprint:$sessionFingerprint';

    if (_fingerprint == fingerprint) return;
    _fingerprint = fingerprint;

    unawaited(
      dailyPlan.sync(
        owner: owner,
        dog: dog,
        profile: assessment.profile!,
        assessment: assessment.assessment!,
        progressRecords: progress.records,
        sessions: progress.sessions,
      ),
    );
  }

  void dispose() {
    identity.removeListener(_bind);
    assessment.removeListener(_bind);
    progress.removeListener(_bind);
  }
}

class DailyPlanScope extends InheritedNotifier<DailyPlanController> {
  const DailyPlanScope({
    super.key,
    required DailyPlanController controller,
    required super.child,
  }) : super(notifier: controller);

  static DailyPlanController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<DailyPlanScope>()?.notifier;

  static DailyPlanController of(BuildContext context) => maybeOf(context)!;
}
