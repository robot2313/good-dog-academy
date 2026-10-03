import '../identity/app_identity_record.dart';
import '../lessons/domain/lesson_models.dart';
import '../lessons/logic/lesson_unlock_service.dart';
import '../lessons/progress/lesson_progress_record.dart';

class PassportGroup {
  const PassportGroup({
    required this.title,
    required this.total,
    required this.completed,
    required this.inProgress,
  });
  final String title;
  final int total;
  final int completed;
  final int inProgress;
}

class LearningPassport {
  const LearningPassport({
    required this.ownerId,
    required this.dogId,
    required this.dogName,
    required this.total,
    required this.completed,
    required this.inProgress,
    required this.skills,
    required this.stages,
    required this.continueLessons,
  });
  final String ownerId;
  final String dogId;
  final String dogName;
  final int total;
  final int completed;
  final int inProgress;
  final List<PassportGroup> skills;
  final List<PassportGroup> stages;
  final List<LessonDefinition> continueLessons;
  double get completionFraction => total == 0 ? 0 : completed / total;
}

/// Lesson-only passport. Completion follows the existing unlock criteria,
/// exactly as Journey does; it is not evidence of real-world reliability.
class LearningPassportService {
  const LearningPassportService();
  LearningPassport query({
    required AppOwnerRecord owner,
    required AppDogRecord dog,
    required List<LessonDefinition> catalogue,
    required Iterable<LessonProgressRecord> progress,
  }) {
    owner.validate();
    dog.validate();
    if (dog.ownerId != owner.id) throw StateError('Dog ownership mismatch.');
    final records = progress.toList(growable: false);
    final ids = <String>{};
    for (final record in records) {
      record.validate();
      if (record.ownerId != owner.id || record.dogId != dog.id) {
        throw StateError(
          'Passport requires progress for the selected owned dog only.',
        );
      }
      if (!ids.add(record.id)) throw StateError('Duplicate progress record.');
    }
    final lessons = LessonUnlockService(catalogue)
        .resolve(records.map((r) => r.toSnapshot()))
        .values
        .toList();
    PassportGroup group(String title, Iterable<LessonLibraryItem> items) {
      final list = items.toList();
      return PassportGroup(
        title: title,
        total: list.length,
        completed: list.where((l) => l.state == LessonState.completed).length,
        inProgress: list.where((l) => l.state == LessonState.inProgress).length,
      );
    }

    final total = group('All lessons', lessons);
    final skills = catalogue.map((l) => l.skill).toSet().toList()..sort();
    final byLesson = {for (final record in records) record.lessonId: record};
    final continuing =
        lessons
            .where((l) => l.state == LessonState.inProgress)
            .map((l) => l.definition)
            .toList()
          ..sort((a, b) {
            final recent = (byLesson[b.id]?.lastAttemptedAt ?? '').compareTo(
              byLesson[a.id]?.lastAttemptedAt ?? '',
            );
            return recent == 0 ? a.id.compareTo(b.id) : recent;
          });
    return LearningPassport(
      ownerId: owner.id,
      dogId: dog.id,
      dogName: dog.name,
      total: total.total,
      completed: total.completed,
      inProgress: total.inProgress,
      skills: List.unmodifiable(
        skills.map(
          (skill) => group(
            skill
                .split('-')
                .map(
                  (p) =>
                      p.isEmpty ? p : '${p[0].toUpperCase()}${p.substring(1)}',
                )
                .join(' '),
            lessons.where((l) => l.definition.skill == skill),
          ),
        ),
      ),
      stages: List.unmodifiable(
        [
          group(
            'Foundation',
            lessons.where((l) => l.definition.difficulty == 1),
          ),
          group(
            'Building Skills',
            lessons.where((l) => l.definition.difficulty == 2),
          ),
          group(
            'Real World',
            lessons.where((l) => l.definition.difficulty == 3),
          ),
          group(
            'Lifelong Skills',
            lessons.where((l) => l.definition.difficulty >= 4),
          ),
        ].where((g) => g.total > 0),
      ),
      continueLessons: List.unmodifiable(continuing),
    );
  }
}
