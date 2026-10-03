import 'package:flutter/widgets.dart';

import '../identity/app_identity_record.dart';
import 'assessment_models.dart';
import 'assessment_repository.dart';
import 'assessment_scoring.dart';

class AssessmentController extends ChangeNotifier {
  AssessmentController({required this.repository});

  final AssessmentRepository repository;
  bool loading = false;
  bool loaded = false;
  bool saving = false;
  Object? error;
  String? ownerId;
  String? dogId;
  BehaviourProfileRecord? profile;
  BehaviourAssessmentRecord? assessment;
  bool _disposed = false;

  bool get completed => assessment != null && profile?.assessmentId == assessment?.id;

  void _notify() {
    if (!_disposed) notifyListeners();
  }

  Future<void> loadForDog({
    required String ownerId,
    required AppDogRecord dog,
  }) async {
    loading = true;
    loaded = false;
    error = null;
    this.ownerId = ownerId;
    dogId = dog.id;
    profile = null;
    assessment = null;
    _notify();

    try {
      final state = await repository.load();
      if (this.ownerId != ownerId || dogId != dog.id) return;
      final loadedProfile = state.profileForDog(dog.id);
      final loadedAssessment = state.currentAssessmentForDog(dog.id);
      if (loadedAssessment != null && loadedAssessment.ownerId != ownerId) {
        throw const AssessmentPersistenceException(
          'Stored assessment ownership is inconsistent.',
        );
      }
      profile = loadedProfile;
      assessment = loadedAssessment;
      loaded = true;
    } catch (cause) {
      if (this.ownerId == ownerId && dogId == dog.id) error = cause;
    } finally {
      if (this.ownerId == ownerId && dogId == dog.id) {
        loading = false;
        _notify();
      }
    }
  }

  void clear() {
    ownerId = null;
    dogId = null;
    profile = null;
    assessment = null;
    error = null;
    loading = false;
    loaded = false;
    _notify();
  }

  Future<void> reloadForDog(AppDogRecord dog) async {
    final owner = ownerId;
    if (owner == null) return;
    await loadForDog(ownerId: owner, dog: dog);
  }

  Future<bool> complete({
    required String ownerId,
    required AppDogRecord dog,
    required Map<String, AssessmentOption> answers,
    DateTime? now,
  }) async {
    if (!loaded || loading || saving || this.ownerId != ownerId || dogId != dog.id) {
      return false;
    }

    saving = true;
    error = null;
    _notify();
    try {
      final result = calculateAssessmentScores(answers);
      final timestamp = (now ?? DateTime.now()).toUtc().toIso8601String();
      final assessmentId =
          'behaviour-assessment-${dog.id}-${(now ?? DateTime.now()).toUtc().microsecondsSinceEpoch}';
      final nextAssessment = BehaviourAssessmentRecord(
        id: assessmentId,
        ownerId: ownerId,
        dogId: dog.id,
        responses: result.responses,
        calculatedScores: result.calculatedScores,
        unknownSkills: result.unknownSkills,
        completedAt: timestamp,
      );

      final existing = profile;
      final nextProfile = BehaviourProfileRecord(
        id: existing?.id ?? 'behaviour-profile-${dog.id}',
        dogId: dog.id,
        energyLevel: dog.energyLevel.name,
        foodMotivation: existing?.foodMotivation ?? 'medium',
        challenges: existing?.challenges ?? const <String>[],
        skillScores: result.calculatedScores,
        unknownSkills: result.unknownSkills,
        assessmentId: nextAssessment.id,
        notes: existing?.notes ?? '',
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      );

      await repository.complete(
        assessment: nextAssessment,
        profile: nextProfile,
      );
      assessment = nextAssessment;
      profile = nextProfile;
      return true;
    } catch (cause) {
      error = cause;
      return false;
    } finally {
      saving = false;
      _notify();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    super.dispose();
  }
}

class AssessmentScope extends InheritedNotifier<AssessmentController> {
  const AssessmentScope({
    super.key,
    required AssessmentController controller,
    required super.child,
  }) : super(notifier: controller);

  static AssessmentController? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AssessmentScope>()?.notifier;

  static AssessmentController of(BuildContext context) => maybeOf(context)!;
}
